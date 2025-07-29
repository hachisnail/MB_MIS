import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js';

export const Schedule = mainDb.define('Schedule', {
  schedule_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  availability: {
    type: DataTypes.ENUM('SHARED', 'EXCLUSIVE'),
    allowNull: false,
    defaultValue: 'SHARED',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
}, {
  tableName: 'schedules',
  timestamps: true, // Use Sequelize's automatic timestamps (createdAt, updatedAt)
});

// Add database change hooks for real-time updates
addDbChangeHooks(Schedule, "Schedule");

// Export default for easier importing
export default Schedule;
