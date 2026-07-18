import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { LAB_TEST_STATUS_LIST } from "../constants.js";

const LabTest = sequelize.define(
  "LabTest",
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
    test_type: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...LAB_TEST_STATUS_LIST),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    critical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    collected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "lab_tests",
    timestamps: true,
    indexes: [
      { fields: ["patient_id"] },
      { fields: ["doctor_id"] },
      { fields: ["status"] },
    ],
  },
);

export default LabTest;