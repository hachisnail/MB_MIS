// This file ensures all appointment models and their relationships are properly loaded
import Visitor from './visitorModels.js';
import Appointment from './appointmentModels.js';
import AppointmentStatus from './appointmentStatusModels.js';

// Define relationships after all models are loaded
// One visitor has many appointments
Visitor.hasMany(Appointment, { 
  foreignKey: 'visitor_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Appointment.belongsTo(Visitor, { 
  foreignKey: 'visitor_id'
});

// One appointment has one status
Appointment.hasOne(AppointmentStatus, { 
  foreignKey: 'appointment_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
AppointmentStatus.belongsTo(Appointment, { 
  foreignKey: 'appointment_id'
});

// Export all models for easy access
export {
  Visitor,
  Appointment,
  AppointmentStatus
};
