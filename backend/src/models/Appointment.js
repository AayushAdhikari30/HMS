import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { APPOINTMENT_STATUS_LIST } from "../constants.js";

const Appointment = sequelize.define(
  "Appointment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...APPOINTMENT_STATUS_LIST),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelled_by: {
      type: DataTypes.ENUM("patient", "doctor", "admin"),
      allowNull: true,
    },
  },
  {
    tableName: "appointments",
    timestamps: true,
    indexes: [
      { fields: ["doctor_id", "appointment_date"] },
      { fields: ["patient_id"] },
    ],
  },
);

export default Appointment;