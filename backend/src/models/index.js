import sequelize from "../db/connection.js";
import User from "./User.js";
import Patient from "./Patient.js";
import StaffProfile from "./StaffProfile.js";
import Appointment from "./Appointment.js";
import DoctorAvailability from "./DoctorAvailability.js";
import DoctorTimeOff from "./DoctorTimeOff.js";
import Prescription from "./Prescription.js";
import LabTest from "./LabTest.js";
import Referral from "./Referral.js";
import Invoice from "./Invoice.js";
import Notification from "./Notification.js";
import Medicine from "./Medicine.js";

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

// Prescriptions: written by a doctor for a patient, optionally tied to a specific appointment
Patient.hasMany(Prescription, {
  foreignKey: "patient_id",
  as: "prescriptions",
  onDelete: "CASCADE",
});
Prescription.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(Prescription, {
  foreignKey: "doctor_id",
  as: "prescriptionsWritten",
  onDelete: "CASCADE",
});
Prescription.belongsTo(User, { foreignKey: "doctor_id", as: "doctor" });

Appointment.hasOne(Prescription, {
  foreignKey: "appointment_id",
  as: "prescription",
});
Prescription.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });

// Lab tests: patient self-requests a test, a lab assistant (or admin) fulfills it
Patient.hasMany(LabTest, {
  foreignKey: "patient_id",
  as: "labTests",
  onDelete: "CASCADE",
});
LabTest.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(LabTest, {
  foreignKey: "lab_assistant_id",
  as: "labTestsHandled",
});
LabTest.belongsTo(User, { foreignKey: "lab_assistant_id", as: "labAssistant" });

// A doctor may also order a lab test on behalf of one of their patients
User.hasMany(LabTest, {
  foreignKey: "ordered_by_id",
  as: "labTestsOrdered",
});
LabTest.belongsTo(User, { foreignKey: "ordered_by_id", as: "orderedBy" });

// Referrals: a doctor refers a patient to another doctor
Patient.hasMany(Referral, {
  foreignKey: "patient_id",
  as: "referrals",
  onDelete: "CASCADE",
});
Referral.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(Referral, {
  foreignKey: "referring_doctor_id",
  as: "referralsSent",
});
Referral.belongsTo(User, { foreignKey: "referring_doctor_id", as: "referringDoctor" });

User.hasMany(Referral, {
  foreignKey: "referred_doctor_id",
  as: "referralsReceived",
});
Referral.belongsTo(User, { foreignKey: "referred_doctor_id", as: "referredDoctor" });

// Invoices: an admin bills a patient for services
Patient.hasMany(Invoice, {
  foreignKey: "patient_id",
  as: "invoices",
  onDelete: "CASCADE",
});
Invoice.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(Invoice, {
  foreignKey: "created_by_id",
  as: "invoicesCreated",
});
Invoice.belongsTo(User, { foreignKey: "created_by_id", as: "createdBy" });

// Notifications: in-app inbox per user
User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
  onDelete: "CASCADE",
});
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

export {
  sequelize,
  User,
  Patient,
  StaffProfile,
  Appointment,
  DoctorAvailability,
  DoctorTimeOff,
  Prescription,
  LabTest,
  Referral,
  Invoice,
  Notification,
  Medicine,
};
