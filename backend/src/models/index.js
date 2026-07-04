import sequelize from "../db/connection.js";
import User from "./User.js";
import Patient from "./Patient.js";
import StaffProfile from "./StaffProfile.js";
import Appointment from "./Appointment.js";
import DoctorAvailability from "./DoctorAvailability.js";
import DoctorTimeOff from "./DoctorTimeOff.js";

User.hasOne(Patient, {
  foreignKey: "user_id",
  as: "patientProfile",
  onDelete: "CASCADE",
});
Patient.belongsTo(User, { foreignKey: "user_id", as: "account" });

User.hasOne(StaffProfile, {
  foreignKey: "user_id",
  as: "staffProfile",
  onDelete: "CASCADE",
});
StaffProfile.belongsTo(User, { foreignKey: "user_id", as: "account" });

// Appointments: patient books with a doctor (doctor is a User with role="doctor")
Patient.hasMany(Appointment, {
  foreignKey: "patient_id",
  as: "appointments",
  onDelete: "CASCADE",
});
Appointment.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(Appointment, {
  foreignKey: "doctor_id",
  as: "doctorAppointments",
  onDelete: "CASCADE",
});
Appointment.belongsTo(User, { foreignKey: "doctor_id", as: "doctor" });

// Doctor availability: recurring weekly windows + one-off days off
User.hasMany(DoctorAvailability, {
  foreignKey: "doctor_id",
  as: "availability",
  onDelete: "CASCADE",
});
DoctorAvailability.belongsTo(User, { foreignKey: "doctor_id", as: "doctor" });

User.hasMany(DoctorTimeOff, {
  foreignKey: "doctor_id",
  as: "timeOff",
  onDelete: "CASCADE",
});
DoctorTimeOff.belongsTo(User, { foreignKey: "doctor_id", as: "doctor" });

export {
  sequelize,
  User,
  Patient,
  StaffProfile,
  Appointment,
  DoctorAvailability,
  DoctorTimeOff,
};
