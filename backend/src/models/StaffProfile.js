import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const StaffProfile = sequelize.define(
  "StaffProfile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    fullname: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "staff_profiles",
    timestamps: true,
  },
);

export default StaffProfile;
