import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const PharmacyTransaction = sequelize.define(
  "PharmacyTransaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    pharmacist_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Array of { medicineId, medicineName, quantity, dispensedQty, unitPrice, totalPrice }
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("pending", "partially_fulfilled", "fulfilled", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fulfilled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "pharmacy_transactions",
    timestamps: true,
    indexes: [
      { fields: ["prescription_id"] },
      { fields: ["patient_id"] },
      { fields: ["pharmacist_id"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  },
);

export default PharmacyTransaction;
