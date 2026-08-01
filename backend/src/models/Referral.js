import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { REFERRAL_STATUS_LIST } from "../constants.js";

const Referral = sequelize.define(
  "Referral",
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
    referring_doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    referred_doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...REFERRAL_STATUS_LIST),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "referrals",
    timestamps: true,
    indexes: [
      { fields: ["patient_id"] },
      { fields: ["referring_doctor_id"] },
      { fields: ["referred_doctor_id"] },
      { fields: ["status"] },
    ],
  },
);

export default Referral;
