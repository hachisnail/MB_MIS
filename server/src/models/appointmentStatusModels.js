import { DataTypes } from 'sequelize';
import { mainDb } from '../configs/databases.js';
import { addDbChangeHooks } from '../hooks/emitDbChangeHooks.js';

const AppointmentStatus = mainDb.define('AppointmentStatus', {
  status_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  present_count: {
    type: DataTypes.INTEGER,
    allowNull: true, // no default, NULL means "ongoing" in the front-end
    comment: 'Number of visitors who actually showed up'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'appointment_status',
  timestamps: false
});

addDbChangeHooks(AppointmentStatus, "AppointmentStatus");

export default AppointmentStatus;
