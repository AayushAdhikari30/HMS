import { Op } from "sequelize";
import { Medicine } from "../models/index.js";
import { HTTP } from "../constants.js";

const serialize = (m) => ({
  id: m.id,
  name: m.name,
  genericName: m.generic_name,
  category: m.category,
  section: m.section,
  aisle: m.aisle,
  shelf: m.shelf,
  location: [m.section, m.aisle, m.shelf].filter(Boolean).join(" · "),
  form: m.form,
  strength: m.strength,
  unitPrice: Number(m.unit_price),
  stock: m.stock,
  reorderThreshold: m.reorder_threshold,
  lowStock: m.stock <= m.reorder_threshold,
  outOfStock: m.stock === 0,
  manufacturer: m.manufacturer,
  description: m.description,
  expiryDate: m.expiry_date,
  requiresPrescription: m.requires_prescription,
});

// GET /medicines — list with optional ?search=&section=&lowStock=true
export const listMedicines = async (req, res) => {
  try {
    const { search, section, lowStock } = req.query;
    const where = {};

    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.like]: like } },
        { generic_name: { [Op.like]: like } },
      ];
    }
    if (section) where.section = section;

    let medicines = await Medicine.findAll({
      where,
      order: [
        ["section", "ASC"],
        ["aisle", "ASC"],
        ["shelf", "ASC"],
        ["name", "ASC"],
      ],
    });

    if (lowStock === "true") {
      medicines = medicines.filter((m) => m.stock <= m.reorder_threshold);
    }

    return res.status(HTTP.OK).json({
      success: true,
      medicines: medicines.map(serialize),
    });
  } catch (err) {
    console.error("[medicines/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /medicines/sections — distinct sections + counts (for the locate view)
export const listSections = async (_req, res) => {
  try {
    const medicines = await Medicine.findAll({
      attributes: ["section", "stock", "reorder_threshold"],
    });
    const map = new Map();
    for (const m of medicines) {
      const entry = map.get(m.section) ?? { section: m.section, count: 0, lowStock: 0 };
      entry.count += 1;
      if (m.stock <= m.reorder_threshold) entry.lowStock += 1;
      map.set(m.section, entry);
    }
    return res.status(HTTP.OK).json({
      success: true,
      sections: [...map.values()].sort((a, b) => a.section.localeCompare(b.section)),
    });
  } catch (err) {
    console.error("[medicines/sections]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /medicines/:id — single lookup
export const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return res.status(HTTP.NOT_FOUND).json({ message: "Medicine not found" });
    return res.status(HTTP.OK).json({ success: true, medicine: serialize(medicine) });
  } catch (err) {
    console.error("[medicines/get]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /medicines/:id/stock — adjust stock (delta, positive receives; negative dispenses)
export const adjustStock = async (req, res) => {
  try {
    const { delta } = req.body;
    const change = Number(delta);
    if (!Number.isInteger(change) || change === 0) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "delta must be a non-zero integer" });
    }

    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return res.status(HTTP.NOT_FOUND).json({ message: "Medicine not found" });

    const newStock = medicine.stock + change;
    if (newStock < 0) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `Insufficient stock — only ${medicine.stock} on hand`,
      });
    }

    await medicine.update({ stock: newStock });
    return res.status(HTTP.OK).json({ success: true, medicine: serialize(medicine) });
  } catch (err) {
    console.error("[medicines/adjust]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
