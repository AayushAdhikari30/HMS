import sequelize from "../db/connection.js";
import User from "./User.js";
import Patient from "./Patient.js";
import StaffProfile from "./StaffProfile.js";
import Appointment from "./Appointment.js";
import DoctorAvailability from "./DoctorAvailability.js";
import DoctorTimeOff from "./DoctorTimeOff.js";
import Prescription from "./Prescription.js";
import LabTest from "./LabTest.js";
import Medicine from "./Medicine.js";
import PharmacyTransaction from "./PharmacyTransaction.js";

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
Prescription.belongsTo(Appointment, {
  foreignKey: "appointment_id",
  as: "appointment",
});

Patient.hasMany(LabTest, {
  foreignKey: "patient_id",
  as: "LabTests",
  onDelete: "CASCADE",
});
LabTest.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(LabTest, {
  foreignKey: "doctor_id",
  as: "labTestsRequested",
  onDelete: "CASCADE",
});
LabTest.belongsTo(User , {foreignKey: "doctor_id", as: "doctor"});

// Pharmacy relationships
Prescription.hasMany(PharmacyTransaction, {
  foreignKey: "prescription_id",
  as: "transactions",
  onDelete: "CASCADE",
});
PharmacyTransaction.belongsTo(Prescription, { foreignKey: "prescription_id", as: "prescription" });

Patient.hasMany(PharmacyTransaction, {
  foreignKey: "patient_id",
  as: "pharmacyTransactions",
  onDelete: "CASCADE",
});
PharmacyTransaction.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

User.hasMany(PharmacyTransaction, {
  foreignKey: "pharmacist_id",
  as: "dispensedTransactions",
  onDelete: "CASCADE",
});
PharmacyTransaction.belongsTo(User, { foreignKey: "pharmacist_id", as: "pharmacist" });

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
  Medicine,
  PharmacyTransaction,
};
