import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const DoctorAvailability = sequelize.define(
  "DoctorAvailability",
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
    // 0 = Sunday ... 6 = Saturday (matches JS Date#getDay())
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    slot_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "doctor_availability",
    timestamps: true,
    indexes: [{ fields: ["doctor_id", "day_of_week"] }],
  },
);

export default DoctorAvailability;