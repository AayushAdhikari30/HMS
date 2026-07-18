import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { NOTIFICATION_TYPE_LIST } from "../constants.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...NOTIFICATION_TYPE_LIST),
      allowNull: false,
      defaultValue: "system",
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["user_id", "is_read"] },
    ],
  },
);

export default Notification;
