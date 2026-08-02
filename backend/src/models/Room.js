import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Room = sequelize.define(
  "Room",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM("General Ward", "ICU", "Private", "Operation Theater"),
      allowNull: false,
    },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM("Available", "Occupied", "Maintenance"),
      allowNull: false,
      defaultValue: "Available",
    },
  },
  { tableName: "rooms", timestamps: true },
);

export default Room;