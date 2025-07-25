import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';

const Appointment = mainDb.define('Appointment', {
  appointment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  visitor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  purpose_of_visit: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  population_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  preferred_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: true,  // Can be null for "Flexible" time
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true,  // Can be null for "Flexible" time
  },
  creation_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  additional_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'appointment',
  timestamps: false
});

export default Appointment;
