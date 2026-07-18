import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Medicine = sequelize.define(
  "Medicine",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    generic_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
   
    section: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    aisle: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    shelf: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    form: {
      type: DataTypes.STRING(40),
      allowNull: true, // Tablet, Capsule, Syrup, Injection, Inhaler…
    },
    strength: {
      type: DataTypes.STRING(40),
      allowNull: true, // "500 mg", "10 mg/5 ml"
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorder_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    requires_prescription: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "medicines",
    timestamps: true,
    indexes: [
      { fields: ["name"] },
      { fields: ["generic_name"] },
      { fields: ["section"] },
      { fields: ["category"] },
    ],
  },
);

export default Medicine;