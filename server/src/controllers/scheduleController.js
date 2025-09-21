import { Schedule } from '../models/scheduleModels.js';
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

    // Basic validation - client-side should handle most validation
    if (!title || !date || !start_time || !end_time || !availability) {
      return res.status(400).json({
        message: 'Please fill in all required fields'
      });
    }

    // Simple server-side checks for data integrity
    if (!['SHARED', 'EXCLUSIVE'].includes(availability)) {
      return res.status(400).json({
        message: 'Invalid schedule type'
      });
    }

    // Create the schedule - trust client-side validation for business rules
    const schedule = await Schedule.create({
      title,
      description,
      date,
      start_time,
      end_time,
      availability
    });

    // Get user info for logging
    const userId = req.session?.user?.id || 1;
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
      message: 'Schedule created successfully!',
      schedule_id: schedule.schedule_id
    });

  } catch (error) {
    console.error('Error creating schedule:', error);

    // User-friendly error messages
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Please check your schedule information and try again'
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'A schedule with this information already exists'
      });
    }

    return res.status(500).json({
      message: 'Something went wrong while creating your schedule. Please try again.'
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
