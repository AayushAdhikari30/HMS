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
    test_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...LAB_TEST_STATUS_LIST),
      allowNull: false,
      defaultValue: "requested",
    },
    lab_assistant_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ordered_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    indexes: [{ fields: ["patient_id"] }, { fields: ["status"] }],
  },
);

export default LabTest;
