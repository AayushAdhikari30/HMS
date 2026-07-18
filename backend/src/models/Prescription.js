import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Prescription = sequelize.define(
  "Prescription",
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
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Array of { name, dosage, frequency, duration, instructions }
    medications: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "prescriptions",
    timestamps: true,
    indexes: [{ fields: ["patient_id"] }, { fields: ["doctor_id"] }],
  },
);

export default Prescription;