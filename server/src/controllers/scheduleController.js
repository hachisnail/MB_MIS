import { Schedule } from '../models/scheduleModels.js';
import { Appointment, AppointmentStatus } from '../models/appointmentIndex.js';
import { Op } from 'sequelize';
import { createLog } from '../services/logService.js';

/**
 * Create a new schedule
 */
export const createSchedule = async (req, res) => {
  try {
    console.log('createSchedule called with body:', req.body);
    
    const {
      title,
      description,
      date,
      start_time,
      end_time,
      availability
    } = req.body;

    // Basic validation
    if (!title || !date || !start_time || !end_time) {
      console.error('Missing required fields:', { title, date, start_time, end_time });
      return res.status(400).json({ message: 'Missing required schedule fields.' });
    }

    // Validate availability
    if (!['SHARED', 'EXCLUSIVE'].includes(availability)) {
      console.error('Invalid availability type:', availability);
      return res.status(400).json({ message: 'Invalid availability type.' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ 
        message: 'Invalid date format. Expected YYYY-MM-DD format.',
        receivedDate: date
      });
    }

    // Convert times to minutes for comparison
    const timeStringToMinutes = (str) => {
      const [hourStr, minuteStr] = str.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10) || 0;
      return hour * 60 + minute;
    };

    const startMinutes = timeStringToMinutes(start_time);
    const endMinutes = timeStringToMinutes(end_time);
    const sevenAM = timeStringToMinutes('07:00');
    const fivePM = timeStringToMinutes('17:00');

    // Validate time range
    if (startMinutes < sevenAM || endMinutes > fivePM) {
      return res.status(400).json({ message: 'Schedule must be between 7:00 AM and 5:00 PM' });
    }

    if (startMinutes >= endMinutes) {
      return res.status(400).json({ message: 'Start time must be earlier than end time' });
    }

    const duration = endMinutes - startMinutes;
    if (duration < 15) {
      return res.status(400).json({ message: 'Schedule duration must be at least 15 minutes' });
    }

    // Check for existing exclusive schedules on the same date
    const existingExclusiveSchedules = await Schedule.findAll({
      where: {
        date,
        availability: 'EXCLUSIVE',
        status: 'ACTIVE'
      }
    });

    // Check for time conflicts with exclusive schedules
    for (const existingSchedule of existingExclusiveSchedules) {
      const existingStart = timeStringToMinutes(existingSchedule.start_time);
      const existingEnd = timeStringToMinutes(existingSchedule.end_time);
      
      if (startMinutes < existingEnd && existingStart < endMinutes) {
        return res.status(400).json({ 
          message: 'Cannot schedule during an exclusive event time slot' 
        });
      }
    }

    // If adding an exclusive event, check for any existing events
    if (availability === 'EXCLUSIVE') {
      // Check existing schedules
      const existingSchedules = await Schedule.findAll({
        where: {
          date,
          status: 'ACTIVE'
        }
      });

      // Check existing approved appointments
      let existingAppointments = [];
      try {
        existingAppointments = await Appointment.findAll({
          where: {
            preferred_date: date
          },
          include: [{
            model: AppointmentStatus,
            where: {
              status: 'APPROVED'
            },
            required: true
          }]
        });
      } catch (appointmentError) {
        console.warn('Error fetching appointments for exclusive check:', appointmentError.message);
        // Continue without appointment check if there's an association error
        existingAppointments = [];
      }

      // Check for overlaps with existing schedules
      for (const existingSchedule of existingSchedules) {
        const existingStart = timeStringToMinutes(existingSchedule.start_time);
        const existingEnd = timeStringToMinutes(existingSchedule.end_time);
        
        if (startMinutes < existingEnd && existingStart < endMinutes) {
          return res.status(400).json({ 
            message: 'Cannot set as exclusive - time slot already has events scheduled' 
          });
        }
      }

      // Check for overlaps with existing appointments
      for (const appointment of existingAppointments) {
        if (appointment.start_time && appointment.end_time) {
          const appointmentStart = timeStringToMinutes(appointment.start_time);
          const appointmentEnd = timeStringToMinutes(appointment.end_time);
          
          if (startMinutes < appointmentEnd && appointmentStart < endMinutes) {
            return res.status(400).json({ 
              message: 'Cannot set as exclusive - time slot already has events scheduled' 
            });
          }
        }
      }
    }

    // For shared events, check overlapping limit
    if (availability === 'SHARED') {
      const overlappingSchedules = await Schedule.findAll({
        where: {
          date,
          status: 'ACTIVE'
        }
      });

      let overlappingAppointments = [];
      try {
        overlappingAppointments = await Appointment.findAll({
          where: {
            preferred_date: date
          },
          include: [{
            model: AppointmentStatus,
            where: {
              status: 'APPROVED'
            },
            required: true
          }]
        });
      } catch (appointmentError) {
        console.warn('Error fetching appointments for overlap check:', appointmentError.message);
        // Continue without appointment check if there's an association error
        overlappingAppointments = [];
      }

      let overlappingCount = 0;

      // Count overlapping schedules
      for (const schedule of overlappingSchedules) {
        const scheduleStart = timeStringToMinutes(schedule.start_time);
        const scheduleEnd = timeStringToMinutes(schedule.end_time);
        
        if (startMinutes < scheduleEnd && scheduleStart < endMinutes) {
          overlappingCount++;
        }
      }

      // Count overlapping appointments
      for (const appointment of overlappingAppointments) {
        if (appointment.start_time && appointment.end_time) {
          const appointmentStart = timeStringToMinutes(appointment.start_time);
          const appointmentEnd = timeStringToMinutes(appointment.end_time);
          
          if (startMinutes < appointmentEnd && appointmentStart < endMinutes) {
            overlappingCount++;
          }
        }
      }

      if (overlappingCount >= 5) {
        return res.status(400).json({ 
          message: 'Maximum limit reached: Cannot add more than 5 overlapping events' 
        });
      }
    }

    // Create the schedule
    const schedule = await Schedule.create({
      title,
      description,
      date,
      start_time,
      end_time,
      availability
    });

    // Get user info for logging
    const userId = req.session?.user?.id || 1; // Default to system user
    const username = req.session?.user?.username || 'System';

    // Create log entry
    const logDescription = `Schedule "${title}" created for ${date}`;
    const details = `${username} created a ${availability.toLowerCase()} schedule from ${start_time} to ${end_time}`;
    
    await createLog(
      'create',
      'Schedule',
      logDescription,
      userId,
      null,
      schedule.toJSON(),
      details
    );

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule_id: schedule.schedule_id
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      message: 'Server error creating schedule.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get all schedules with optional date filtering
 */
export const getAllSchedules = async (req, res) => {
  try {
    console.log('getAllSchedules called with query:', req.query);
    
    let where = {};
    
    // Handle date filtering if provided
    if (req.query.date) {
      const dateString = req.query.date;
      console.log('Filtering by date:', dateString);
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        console.error('Invalid date format:', dateString);
        return res.status(400).json({ 
          message: 'Invalid date format. Expected YYYY-MM-DD format.',
          receivedDate: dateString
        });
      }
      
      // Use the date string directly since DATEONLY expects YYYY-MM-DD format
      where.date = dateString;
    }

    console.log('Query where clause:', where);

    const schedules = await Schedule.findAll({
      where,
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    console.log(`Found ${schedules.length} schedules`);
    return res.json(schedules);
    
  } catch (error) {
    console.error('Error fetching schedules:', error);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    return res.status(500).json({ 
      message: 'Server error retrieving schedules.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


/**
 * Update schedule status
 */
export const updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    // Capture before state for logging
    const beforeState = schedule.toJSON();

    schedule.status = status;
    await schedule.save();

    // Get user info for logging
    const userId = req.session?.user?.id || 1; // Default to system user
    const username = req.session?.user?.username || 'System';

    // Create log entry
    const statusText = status.toLowerCase().replace('_', ' ');
    const logDescription = `Schedule "${schedule.title}" status updated to ${statusText}`;
    const details = `${username} changed schedule status from ${beforeState.status} to ${status} for schedule on ${schedule.date}`;
    
    await createLog(
      'update',
      'Schedule',
      logDescription,
      userId,
      beforeState,
      schedule.toJSON(),
      details
    );

    return res.status(200).json({
      message: 'Schedule status updated successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error updating schedule status:', error);
    return res.status(500).json({
      message: 'Server error updating schedule status.',
      error: error.message
    });
  }
};

/**
 * Delete a schedule
 */
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    // Capture schedule data before deletion for logging
    const scheduleData = schedule.toJSON();

    await schedule.destroy();

    // Get user info for logging
    const userId = req.session?.user?.id || 1; // Default to system user
    const username = req.session?.user?.username || 'System';

    // Create log entry
    const logDescription = `Schedule "${scheduleData.title}" deleted`;
    const details = `${username} deleted schedule "${scheduleData.title}" that was scheduled for ${scheduleData.date} from ${scheduleData.start_time} to ${scheduleData.end_time}`;
    
    await createLog(
      'delete',
      'Schedule',
      logDescription,
      userId,
      scheduleData,
      null,
      details
    );

    return res.status(200).json({
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({
      message: 'Server error deleting schedule.',
      error: error.message
    });
  }
};

/**
 * Get a specific schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    return res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return res.status(500).json({
      message: 'Server error retrieving schedule.',
      error: error.message
    });
  }
};
