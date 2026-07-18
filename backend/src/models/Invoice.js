import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { INVOICE_STATUS_LIST, PAYMENT_METHOD_LIST } from "../constants.js";

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_by_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Array of { description, quantity, unitPrice, amount }
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...INVOICE_STATUS_LIST),
      allowNull: false,
      defaultValue: "unpaid",
    },
    payment_method: {
      type: DataTypes.ENUM(...PAYMENT_METHOD_LIST),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "invoices",
    timestamps: true,
    indexes: [
      { fields: ["patient_id"] },
      { fields: ["status"] },
      { fields: ["invoice_number"] },
    ],
  },
);

export default Invoice;
