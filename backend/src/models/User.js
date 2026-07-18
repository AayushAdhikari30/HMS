import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    identifier: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM(
        "patient",
        "doctor",
        "pharmacist",
        "lab_assistant",
        "admin",
      ),
      allowNull: false,
    },

    refresh_token_version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // Null until the user clicks the link we email on registration.
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

export default User;