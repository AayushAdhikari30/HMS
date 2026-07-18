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
    // Staff log in with a generated staff ID (DOC001), not an email, so their
    // contact address has to live here or we have no way to reach them.
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: { isEmail: true },
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
