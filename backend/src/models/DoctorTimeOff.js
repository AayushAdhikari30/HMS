import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const DoctorTimeOff = sequelize.define(
  "DoctorTimeOff",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "doctor_time_off",
    timestamps: true,
    indexes: [{ unique: true, fields: ["doctor_id", "date"] }],
  },
);

export default DoctorTimeOff;