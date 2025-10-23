import { Visitor, Appointment, AppointmentStatus } from '../models/appointmentIndex.js';
import { Op } from 'sequelize';
import { sendEmail } from '../services/emailTransporter.js';
import { createLog } from '../services/logService.js';

/**
 * Create a new appointment, reusing or creating the visitor.
 */
export const createAppointment = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      organization,
      province,
      barangay,
      city_municipality,
      street,
      purpose_of_visit,
      population_count,
      preferred_date,
      start_time,
      end_time,
      additional_notes,
      request_letter_files,
      status // Destructure status
    } = req.body;

    // Basic checks
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'Missing required visitor fields.' });
    }
    if (!purpose_of_visit || !population_count || !preferred_date) {
      return res.status(400).json({ message: 'Missing required appointment info.' });
    }

    // Enforce time only for certain purposes
    const timesRequired = ['School Field Trip', 'Museum Group Tour'];
    if (timesRequired.includes(purpose_of_visit) && (!start_time || !end_time)) {
      return res.status(400).json({
        message: `Time selection is required for ${purpose_of_visit}`
      });
    }

    // Always create a new visitor (no update, even if same info exists)
    const visitor = await Visitor.create({
      first_name,
      last_name,
      email,
      phone,
      organization,
      province,
      barangay,
      city_municipality,
      street
    });


    // Insert new appointment with start_time and end_time
    const appointment = await Appointment.create({
      visitor_id: visitor.visitor_id,
      purpose_of_visit,
      population_count,
      preferred_date,
      start_time: start_time || null,
      end_time: end_time || null,
      additional_notes,
      request_letter_files: JSON.stringify(request_letter_files || [])
    });

    // Create the corresponding AppointmentStatus record
    const appointmentStatus = await AppointmentStatus.create({
      appointment_id: appointment.appointment_id,
      status: status || 'PENDING', // Use status from body or default to PENDING
    });

    // Log the appointment creation (only if this is from admin side)
    if (req.session?.user) {
      const userId = req.session.user.id;
      const username = req.session.user.username || 'Admin';
      const visitorName = `${first_name} ${last_name}`;
      
      await createLog(
        'create',
        'APPOINTMENT',
        `New appointment created for ${visitorName} with purpose: ${purpose_of_visit}`,
        userId,
        null,
        {
          appointment_id: appointment.appointment_id,
          visitor_name: visitorName,
          purpose_of_visit,
          preferred_date,
          status: status || 'PENDING'
        },
        `${username} created appointment #${appointment.appointment_id} for ${visitorName}`
      );
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment_id: appointment.appointment_id
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      message: 'Server error creating appointment.',
      error: error.message
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, present_count } = req.body;

    // Confirm the appointment exists
    const appointment = await Appointment.findByPk(id, {
      include: [Visitor]
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Get user info for logging
    const userId = req.session?.user?.id || 1; // Default to system user
    const username = req.session?.user?.username || 'System';

    // Find or create the linked status record
    let appointmentStatus = await AppointmentStatus.findOne({
      where: { appointment_id: id },
    });

    let beforeState = null;
    let action = 'create';

    if (!appointmentStatus) {
      appointmentStatus = await AppointmentStatus.create({
        appointment_id: id,
        status: status || 'PENDING',
        present_count,
      });
    } else {
      // Capture before state for logging
      beforeState = appointmentStatus.toJSON();
      action = 'update';

      if (status !== undefined) {
        appointmentStatus.status = status;
      }
      if (present_count !== undefined) {
        appointmentStatus.present_count = present_count;
      }
      appointmentStatus.updated_at = new Date();
      await appointmentStatus.save();
    }

    // Create log entry
    const visitorName = `${appointment.Visitor?.first_name || ''} ${appointment.Visitor?.last_name || ''}`.trim();
    const statusText = status ? status.toLowerCase().replace('_', ' ') : 'status';
    const description = `Appointment from with an ID of #${id} and a name of ${visitorName} was ${action === 'create' ? 'created with' : 'updated to'} ${statusText}`;

    let details = `${username} ${action === 'create' ? 'set' : 'changed'} appointment status to ${statusText}`;
    if (present_count !== undefined && status === 'COMPLETED') {
      details += ` with ${present_count} visitors present`;
    }

    await createLog(
      action,
      'APPOINTMENT',
      description,
      userId,
      beforeState,
      appointmentStatus.toJSON(),
      details
    );

    return res.status(200).json({
      message: 'Appointment status updated successfully',
      data: appointmentStatus,
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({
      message: 'Server error updating appointment status.',
      error: error.message,
    });
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    // Default should load all data without date filtering
    // Only filter when date is explicitly provided
    const filterDate = req.query.date ? new Date(req.query.date) : null;

    // Build the where clause for date filtering (only if date is provided)
    const dateWhere = {};
    if (filterDate) {
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      dateWhere.creation_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get all appointment data without filtering by default
    const appointments = await Appointment.findAll({
      where: Object.keys(dateWhere).length > 0 ? dateWhere : {},
      include: [
        {
          model: AppointmentStatus,
          required: false
        }
      ],
      attributes: ['appointment_id', 'population_count']
    });

    // Calculate stats in memory
    let approvedCount = 0;
    let rejectedCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let expectedVisitors = 0;
    let presentCount = 0;

    appointments.forEach(appointment => {
      // Sum expected visitors
      expectedVisitors += appointment.population_count || 0;

      // Process status counts
      if (appointment.AppointmentStatus) {
        const status = (appointment.AppointmentStatus.status || '').toUpperCase();

        if (status.includes('APPROV')) approvedCount++;
        else if (status.includes('REJECT')) rejectedCount++;
        else if (status.includes('COMPLET')) completedCount++;
        else if (status.includes('FAIL')) failedCount++;

        // Sum present count - safely handle null values
        const present = appointment.AppointmentStatus.present_count;
        presentCount += present !== null && present !== undefined ? Number(present) : 0;
      }
    });

    return res.json({
      approved: approvedCount,
      rejected: rejectedCount,
      completed: completedCount,
      failed: failedCount,
      expectedVisitors,
      present: presentCount
    });
  } catch (error) {
    console.error('Error retrieving appointment stats:', error);
    return res.status(500).json({
      message: 'Server error retrieving appointment stats.',
      error: error.message
    });
  }
};

/**
 * Fetch all appointments, eagerly loading Visitor data.
 */
export const getAllAppointments = async (req, res) => {
  try {
    // Get date from query param if provided
    const filterDate = req.query.date ? new Date(req.query.date) : null;

    // Build the where clause for date filtering
    let where = {};
    if (filterDate) {
      // Set start and end time for the selected date
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      where.creation_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Fetch all appointments with their related data
    const appointments = await Appointment.findAll({
      where,
      include: [Visitor, AppointmentStatus],
      order: [['creation_date', 'DESC']] // Sort by date, newest first
    });

    // Helper function to format time display
    const formatTimeDisplay = (start_time, end_time) => {
      if (!start_time || !end_time) return "Flexible";

      const formatTime = (time) => {
        if (!time) return '';
        // Handle time string that might be in HH:MM:SS format
        if (time.includes(':')) {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${minutes} ${ampm}`;
        }
        return time;
      };

      const formattedStart = formatTime(start_time);
      const formattedEnd = formatTime(end_time);

      return formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : "Flexible";
    };

    // Process data to prioritize "To Review" status and add preferred_time field
    const toReview = [];
    const others = [];

    // Split appointments into two categories and add formatted preferred_time
    appointments.forEach(appointment => {
      // Convert to plain object and add preferred_time
      const appointmentData = appointment.toJSON();
      appointmentData.preferred_time = formatTimeDisplay(appointmentData.start_time, appointmentData.end_time);

      const status = appointmentData.AppointmentStatus?.status?.toUpperCase() || 'PENDING';
      if (status === 'PENDING') {
        toReview.push(appointmentData);
      } else {
        others.push(appointmentData);
      }
    });

    // Combine arrays with "To Review" first
    const sortedAppointments = [...toReview, ...others];

    return res.json(sortedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Server error retrieving appointments.' });
  }
};

export const getAttendanceData = async (req, res) => {
  try {
    // Get date from query param if provided
    const filterDate = req.query.date ? new Date(req.query.date) : null;

    // Build the where clause for date filtering
    const where = {};
    if (filterDate) {
      // Set start and end time for the selected date
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      where.creation_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const data = await Appointment.findAll({
      where,
      attributes: [
        'appointment_id',
        'purpose_of_visit',
        'preferred_date',
        'population_count',
        'creation_date'
      ],
      include: [
        {
          model: Visitor,
          attributes: ['first_name', 'last_name']
        },
        {
          model: AppointmentStatus,
          attributes: ['status', 'present_count', 'updated_at']
        }
      ]
    });

    // Transform for your front-end: rename fields, etc.
    const transformedData = data.map((appt) => ({
      appointment_id: appt.appointment_id,
      date: appt.creation_date ? new Date(appt.creation_date).toLocaleString() : 'N/A',
      visitorName: `${appt.Visitor?.first_name || 'N/A'} ${appt.Visitor?.last_name || ''}`,
      purpose: appt.purpose_of_visit,
      preferredDate: appt.preferred_date || 'N/A',
      expectedVisitor: appt.population_count,
      // If present_count is null, it's "ongoing" on the front-end
      present: appt.AppointmentStatus?.present_count ?? 'ongoing',
      status: appt.AppointmentStatus?.status || 'PENDING'
    }));

    return res.json(transformedData);
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return res.status(500).json({
      message: 'Server error retrieving attendance data.',
      error: error.message
    });
  }
};

export const getVisitorRecords = async (req, res) => {
  try {
    // Get date from query param if provided
    const filterDate = req.query.date ? new Date(req.query.date) : null;

    let appointmentWhere = {};
    if (filterDate) {
      // Set start and end time for the selected date
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      appointmentWhere.creation_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Load all visitors with their associated appointments and statuses
    const visitors = await Visitor.findAll({
      include: [
        {
          model: Appointment,
          where: Object.keys(appointmentWhere).length > 0 ? appointmentWhere : undefined,
          include: [AppointmentStatus],
        },
      ],
      order: [['visitor_id', 'ASC']], // or any sorting you prefer
    });

    // Transform data for the frontend
    const records = visitors.map((visitor) => {
      // Gather all appointments
      const details = visitor.Appointments.map((appt) => ({
        appointment_id: appt.appointment_id,
        purpose: appt.purpose_of_visit,
        visitorCount: appt.population_count,
        present: appt.AppointmentStatus?.present_count || 0,
        date: appt.preferred_date,
        status: appt.AppointmentStatus?.status || 'PENDING'
      }));

      return {
        id: visitor.visitor_id,
        date: details.length > 0 ? details[0].date : null,
        visitorName: `${visitor.first_name} ${visitor.last_name}`,
        visitCount: details.length,
        details,
      };
    });

    return res.json(records);
  } catch (error) {
    console.error('Error fetching visitor records:', error);
    return res.status(500).json({
      message: 'Server error retrieving visitor records.',
      error: error.message,
    });
  }
};

/**
 * Get detailed information for a specific attendance record
 */
export const getAttendanceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the appointment with ALL fields and its related data
    const appointment = await Appointment.findByPk(id, {
      attributes: [
        'appointment_id',
        'purpose_of_visit',
        'population_count',
        'preferred_date',
        'start_time',
        'end_time',
        'additional_notes',
        'creation_date'
      ],
      include: [
        {
          model: Visitor,
          attributes: [
            'visitor_id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'organization',
            'street',
            'barangay',
            'city_municipality',
            'province'
          ]
        },
        {
          model: AppointmentStatus,
          attributes: ['status', 'present_count', 'updated_at']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Format time display helper function
    const formatTimeDisplay = (start_time, end_time) => {
      if (!start_time || !end_time) return "Flexible";

      const formatTime = (time) => {
        if (!time) return '';
        return time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
      };

      const formattedStart = formatTime(start_time);
      const formattedEnd = formatTime(end_time);

      return formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : "Flexible";
    };

    // Format the data for the frontend
    const detailData = {
      appointment_id: appointment.appointment_id,
      purpose: appointment.purpose_of_visit,
      populationCount: appointment.population_count,
      preferredDate: appointment.preferred_date,
      preferredTime: formatTimeDisplay(appointment.start_time, appointment.end_time),
      notes: appointment.additional_notes,
      creation_date: appointment.creation_date,
      status: appointment.AppointmentStatus?.status || 'PENDING',
      present: appointment.AppointmentStatus?.present_count,
      updatedAt: appointment.AppointmentStatus?.updated_at,

      // Visitor information
      fromFirstName: appointment.Visitor?.first_name || '',
      fromLastName: appointment.Visitor?.last_name || '',
      email: appointment.Visitor?.email || '',
      phone: appointment.Visitor?.phone || '',
      organization: appointment.Visitor?.organization || '',
      street: appointment.Visitor?.street || '',
      barangay: appointment.Visitor?.barangay || '',
      city_municipality: appointment.Visitor?.city_municipality || '',
      province: appointment.Visitor?.province || ''
    };

    return res.json(detailData);
  } catch (error) {
    console.error('Error fetching attendance detail:', error);
    return res.status(500).json({
      message: 'Server error retrieving attendance detail.',
      error: error.message
    });
  }
};

/**
 * Get visitor record detail by visitor ID and appointment ID
 */
export const getVisitorRecordDetail = async (req, res) => {
  try {
    const { visitorId, appointmentId } = req.params;
    console.log('Searching for visitor/appointment:', { visitorId, appointmentId });

    // Find the specific visitor
    const visitor = await Visitor.findByPk(visitorId);
    console.log('Found visitor:', visitor ? 'yes' : 'no', visitor);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor record not found.' });
    }

    // Find the specific appointment with ALL necessary fields
    const appointment = await Appointment.findOne({
      where: {
        visitor_id: visitorId,
        appointment_id: appointmentId
      },
      attributes: [
        'appointment_id',
        'purpose_of_visit',
        'population_count',
        'preferred_date',
        'start_time',
        'end_time',
        'additional_notes',
        'creation_date'
      ],
      include: [
        {
          model: AppointmentStatus,
          attributes: ['status', 'present_count', 'updated_at']
        }
      ]
    });
    console.log('Found appointment:', appointment ? 'yes' : 'no', appointment);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment record not found for this visitor.' });
    }

    // Format time display helper function
    const formatTimeDisplay = (start_time, end_time) => {
      if (!start_time || !end_time) return "Flexible";

      const formatTime = (time) => {
        if (!time) return '';
        return time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
      };

      const formattedStart = formatTime(start_time);
      const formattedEnd = formatTime(end_time);

      return formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : "Flexible";
    };

    // Format the data for the frontend
    const detailData = {
      appointmentId: appointment.appointment_id,
      dateSent: appointment.creation_date ? new Date(appointment.creation_date).toLocaleString() : 'N/A',
      fromFirstName: visitor.first_name || '',
      fromLastName: visitor.last_name || '',
      email: visitor.email || '',
      phone: visitor.phone || '',
      organization: visitor.organization || '',
      street: visitor.street || '',
      barangay: visitor.barangay || '',
      city_municipality: visitor.city_municipality || '',
      province: visitor.province || '',
      purpose: appointment.purpose_of_visit,
      populationCount: appointment.population_count,
      preferredDate: appointment.preferred_date,
      preferredTime: formatTimeDisplay(appointment.start_time, appointment.end_time),
      notes: appointment.additional_notes,
      status: appointment.AppointmentStatus?.status || 'PENDING',
      updatedAt: appointment.AppointmentStatus?.updated_at ? new Date(appointment.AppointmentStatus.updated_at).toLocaleString() : 'N/A'
    };

    console.log('Formatted detail data:', detailData);

    return res.json(detailData);
  } catch (error) {
    console.error('Error fetching visitor record detail:', error);
    return res.status(500).json({
      message: 'Server error retrieving visitor record detail.',
      error: error.message
    });
  }
};

/**
 * Get a specific appointment by ID with all related data
 */
export const getAppointmentById = async (req, res) => {
  try {
    // The ID might come as a direct number or as part of an encoded string
    const rawId = req.params.id;
    let appointmentId;

    // Try to parse as direct number first
    appointmentId = parseInt(rawId);

    // If that fails, try to decode and extract ID
    if (isNaN(appointmentId)) {
      try {
        const decoded = decodeURIComponent(rawId);
        appointmentId = parseInt(decoded.split(' ')[0]);
      } catch (e) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
    }

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    // Find the appointment with ALL fields and its related data
    const appointment = await Appointment.findByPk(appointmentId, {
      attributes: [
        'appointment_id',
        'purpose_of_visit',
        'population_count',
        'preferred_date',
        'start_time',
        'end_time',
        'additional_notes',
        'creation_date',
        'request_letter_files'
      ],
      include: [
        {
          model: Visitor,
          attributes: [
            'visitor_id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'organization',
            'street',
            'barangay',
            'city_municipality',
            'province'
          ]
        },
        {
          model: AppointmentStatus,
          attributes: ['status', 'present_count', 'updated_at']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Format time display helper function
    const formatTimeDisplay = (start_time, end_time) => {
      if (!start_time || !end_time) return "Flexible";

      const formatTime = (time) => {
        if (!time) return '';
        return time.includes(':') ? time.split(':').slice(0, 2).join(':') : time;
      };

      const formattedStart = formatTime(start_time);
      const formattedEnd = formatTime(end_time);

      return formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : "Flexible";
    };

    // Parse request_letter_files from JSON string
    let requestLetterFiles = [];
    try {
      if (appointment.request_letter_files) {
        requestLetterFiles = JSON.parse(appointment.request_letter_files);
      }
    } catch (error) {
      console.error('Error parsing request_letter_files:', error);
      requestLetterFiles = [];
    }

    // Format the data for the frontend (matching AppointmentViewPage expected format)
    const formattedAppointment = {
      appointmentId: appointment.appointment_id,
      dateSent: appointment.creation_date ? new Date(appointment.creation_date).toLocaleString() : 'N/A',
      fromFirstName: appointment.Visitor?.first_name || '',
      fromLastName: appointment.Visitor?.last_name || '',
      email: appointment.Visitor?.email || '',
      phone: appointment.Visitor?.phone || '',
      organization: appointment.Visitor?.organization || '',
      street: appointment.Visitor?.street || '',
      barangay: appointment.Visitor?.barangay || '',
      city_municipality: appointment.Visitor?.city_municipality || '',
      province: appointment.Visitor?.province || '',
      purpose: appointment.purpose_of_visit,
      populationCount: appointment.population_count,
      preferredDate: appointment.preferred_date,
      preferredTime: formatTimeDisplay(appointment.start_time, appointment.end_time),
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      notes: appointment.additional_notes,
      status: appointment.AppointmentStatus?.status || 'PENDING',
      updatedAt: appointment.AppointmentStatus?.updated_at ? new Date(appointment.AppointmentStatus.updated_at).toLocaleString() : 'N/A',
      requestLetterFiles: requestLetterFiles
    };

    return res.json(formattedAppointment);
  } catch (error) {
    console.error("Failed to fetch specific appointment:", error);
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
};

export const sendEmailNotification = async (req, res) => {
  try {
    const { recipientEmail, subject, message, status, appointmentDetails } = req.body;

    // Basic validation
    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ message: 'Missing required email details' });
    }

    // Determine status banner color and text
    let statusBannerColor = '#4CAF50';
    let statusBannerText = '✓ Appointment APPROVED';
    let statusMessage = 'We are pleased to inform you that your appointment request has been <strong style="color: #4CAF50;">APPROVED</strong>. We look forward to welcoming you to Museo Bulawan!';

    if (status === 'REJECTED') {
      statusBannerColor = '#F44336';
      statusBannerText = '✗ Appointment REJECTED';
      statusMessage = 'We regret to inform you that your appointment request has been <strong style="color: #F44336;">REJECTED</strong>.';
    } else if (status === 'FAILED') {
      statusBannerColor = '#F44336';
      statusBannerText = '✗ Appointment CANCELLED';
      statusMessage = 'Your appointment has been <strong style="color: #F44336;">CANCELLED</strong>.';
    } else if (status === 'COMPLETED') {
      statusBannerColor = '#4CAF50';
      statusBannerText = '✓ Visit COMPLETED';
      statusMessage = 'Your visit has been marked as <strong style="color: #4CAF50;">COMPLETED</strong>. Thank you for visiting Museo Bulawan!';
    }

    // Build the professional email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Museo Bulawan Appointment Update</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                
                <!-- Header with Gold Gradient matching homepage -->
                <tr>
                  <td style="background: linear-gradient(135deg, #DAB765 0%, #EFBF04 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">MUSEO BULAWAN</h1>
                    <p style="margin: 5px 0 0 0; color: #2c2c2c; font-size: 14px; letter-spacing: 1px;">Museum, Archives and Shrine Curation Division</p>
                  </td>
                </tr>

                <!-- Status Banner -->
                <tr>
                  <td style="padding: 0;">
                    <div style="background-color: ${statusBannerColor}; color: white; padding: 20px 40px; text-align: center;">
                      <h2 style="margin: 0; font-size: 24px;">${statusBannerText}</h2>
                    </div>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                      Dear <strong>${appointmentDetails.visitorName}</strong>,
                    </p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 25px 0;">
                      ${statusMessage}
                    </p>

                    ${status === 'APPROVED' ? `
                    <!-- Appointment Details Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; margin: 0 0 25px 0; border: 2px solid #DAB765;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 15px 0; color: #DAB765; font-size: 18px;">📅 Your Appointment Details</h3>
                          <table width="100%" cellpadding="8" cellspacing="0">
                            <tr>
                              <td style="color: #666; font-size: 14px; width: 120px;"><strong>Date:</strong></td>
                              <td style="color: #333; font-size: 14px;">${appointmentDetails.preferredDate}</td>
                            </tr>
                            <tr>
                              <td style="color: #666; font-size: 14px;"><strong>Time:</strong></td>
                              <td style="color: #333; font-size: 14px;">${appointmentDetails.preferredTime}</td>
                            </tr>
                            <tr>
                              <td style="color: #666; font-size: 14px;"><strong>Purpose:</strong></td>
                              <td style="color: #333; font-size: 14px;">${appointmentDetails.purpose}</td>
                            </tr>
                            <tr>
                              <td style="color: #666; font-size: 14px;"><strong>Visitors:</strong></td>
                              <td style="color: #333; font-size: 14px;">${appointmentDetails.populationCount || 'N/A'}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Admin Message -->
                    <div style="background-color: #FFF9E6; border-left: 4px solid #DAB765; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
                      <h4 style="margin: 0 0 10px 0; color: #DAB765; font-size: 16px;">📨 Message from Museo Bulawan:</h4>
                      <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">${message}</p>
                    </div>

                    ${status === 'APPROVED' ? `
                    <!-- Museum Guidelines -->
                    <div style="background-color: #FFF9E6; border-radius: 8px; padding: 25px; margin: 0 0 25px 0; border: 2px solid #DAB765;">
                      <h3 style="margin: 0 0 20px 0; color: #DAB765; font-size: 20px; text-align: center;">📋 MUSEUM VISITOR GUIDELINES</h3>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🚫</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Personal videography inside the Museum is not allowed.</span>
                            </div>
                          </td>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">📷</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Taking pictures of artifacts and displays is not allowed.</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🚫</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Strictly no touching of exhibits.</span>
                            </div>
                          </td>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🐾</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">No pets allowed.</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">⚠️</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Avoid leaning on glass showcases.</span>
                            </div>
                          </td>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #4CAF50; font-size: 18px; margin-right: 8px;">📝</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Registration is mandatory upon entry.</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #2196F3; font-size: 18px; margin-right: 8px;">🔇</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Lower your voices.</span>
                            </div>
                          </td>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🚫</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Sitting and lying on the floor is not allowed.</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🏃</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">Running and playing is not allowed.</span>
                            </div>
                          </td>
                          <td style="padding: 8px; vertical-align: top;">
                            <div style="display: flex; align-items: flex-start;">
                              <span style="color: #F44336; font-size: 18px; margin-right: 8px;">🚭</span>
                              <span style="color: #333; font-size: 13px; line-height: 1.5;">No smoking of cigarettes or e-cigarettes.</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}

                    <div style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 30px;">
                      <p style="margin: 0 0 15px 0; color: #333; font-size: 15px; line-height: 1.6;">
                        Thank you for your interest in Museo Bulawan. We look forward to sharing our cultural heritage with you!
                      </p>
                      <p style="margin: 0; color: #333; font-size: 15px;">
                        Best regards,<br>
                        <strong style="color: #DAB765;">The Museo Bulawan Team</strong>
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #2c2c2c; padding: 30px 40px; text-align: center;">
                    <p style="margin: 0 0 15px 0; color: #DAB765; font-size: 18px; font-weight: bold;">Connect With Us</p>
                    
                    <!-- Social Media Links - Simplified Layout -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px auto;">
                      <tr>
                        <!-- Facebook -->
                        <td style="padding: 0 10px;">
                          <a href="https://www.facebook.com/museobulawancn" target="_blank" style="text-decoration: none; display: block;">
                            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="40" height="40" style="display: block; border: 0;">
                          </a>
                        </td>
                        
                        <!-- Instagram -->
                        <td style="padding: 0 10px;">
                          <a href="https://www.instagram.com/museobulawanofficial/" target="_blank" style="text-decoration: none; display: block;">
                            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="40" height="40" style="display: block; border: 0;">
                          </a>
                        </td>
                        
                        <!-- TikTok -->
                        <td style="padding: 0 10px;">
                          <a href="https://www.tiktok.com/@museobulawan" target="_blank" style="text-decoration: none; display: block;">
                            <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" width="40" height="40" style="display: block; border: 0;">
                          </a>
                        </td>
                        
                        <!-- YouTube -->
                        <td style="padding: 0 10px;">
                          <a href="https://www.youtube.com/@museobulawanofficial" target="_blank" style="text-decoration: none; display: block;">
                            <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" width="40" height="40" style="display: block; border: 0;">
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Contact Information -->
                    <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px;">📧 museobulawanmis@gmail.com</p>
                    <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 14px;">📍 Camarines Norte Provincial Capitol Grounds, Daet Philippines</p>
                    
                    <p style="margin: 0; color: #999; font-size: 12px; border-top: 1px solid #444; padding-top: 15px;">Museum, Archives and Shrine Curation Division</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Use the sendEmail helper function from emailTransporter
    const emailResult = await sendEmail({
      from: '"Museo Bulawan" <museobulawanmis@gmail.com>',
      to: recipientEmail,
      subject: subject,
      html: emailHtml
    });

    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to send email notification',
        error: emailResult.error
      });
    }

    return res.status(200).json({
      message: 'Email notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending email notification:', error);
    return res.status(500).json({
      message: 'Server error sending email notification',
      error: error.message
    });
  }
};

export const uploadAppointmentFiles = async (req, res) => {
  try {
    // Files are already saved to the correct directory by multer middleware
    // Just return the uploaded file information
    const uploadedFiles = req.files.map(file => file.filename);

    console.log(`Successfully uploaded ${uploadedFiles.length} files to request-letter directory:`, uploadedFiles);

    return res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      message: "Server error uploading files",
      error: err.message
    });
  }
};
