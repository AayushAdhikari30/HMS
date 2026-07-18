import { Op } from "sequelize";
import sequelize from "../db/connection.js";
import {
  Patient,
  User,
  StaffProfile,
  Prescription,
  Medicine,
  PharmacyTransaction,
} from "../models/index.js";
import { ROLES, HTTP } from "../constants.js";

const serializeTransaction = (tx) => ({
  id: tx.id,
  prescriptionId: tx.prescription_id,
  pharmacistId: tx.pharmacist_id,
  patientId: tx.patient_id,
  items: tx.items,
  status: tx.status,
  totalAmount: Number(tx.total_amount),
  notes: tx.notes,
  fulfilledAt: tx.fulfilled_at,
  createdAt: tx.createdAt,
  patient: tx.patient
    ? { id: tx.patient.id, name: tx.patient.fullname }
    : undefined,
  pharmacist: tx.pharmacist
    ? {
        id: tx.pharmacist.id,
        name: tx.pharmacist.staffProfile?.fullname ?? tx.pharmacist.identifier,
      }
    : undefined,
  prescription: tx.prescription
    ? {
        id: tx.prescription.id,
        diagnosis: tx.prescription.diagnosis,
        medications: tx.prescription.medications,
      }
    : undefined,
});

// GET /pharmacy/prescriptions — pending prescriptions for pharmacist fulfillment
export const getPendingPrescriptions = async (req, res) => {
  try {
    // Get all unfulfilled prescriptions
    const prescriptions = await Prescription.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: [
        { model: Patient, as: "patient", required: false },
        {
          model: User,
          as: "doctor",
          required: false,
          attributes: ["id", "identifier"],
          include: [{ model: StaffProfile, as: "staffProfile", required: false }],
        },
        {
          model: PharmacyTransaction,
          as: "transactions",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Filter prescriptions that are not fully fulfilled
    const pendingPrescriptions = prescriptions.filter((rx) => {
      const fulfilled = rx.transactions?.some((tx) => tx.status === "fulfilled");
      return !fulfilled;
    });

    const serialized = pendingPrescriptions.map((rx) => ({
      id: rx.id,
      diagnosis: rx.diagnosis,
      medications: rx.medications,
      notes: rx.notes,
      createdAt: rx.createdAt,
      patient: rx.patient
        ? { id: rx.patient.id, name: rx.patient.fullname }
        : undefined,
      doctor: rx.doctor
        ? {
            id: rx.doctor.id,
            name: rx.doctor.staffProfile?.fullname ?? rx.doctor.identifier,
            department: rx.doctor.staffProfile?.department ?? null,
          }
        : undefined,
      fulfillmentStatus:
        rx.transactions && rx.transactions.length > 0
          ? "partially_fulfilled"
          : "pending",
    }));

    return res.status(HTTP.OK).json({
      success: true,
      prescriptions: serialized,
    });
  } catch (err) {
    console.error("[pharmacy/pending-prescriptions]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// POST /pharmacy/dispense — create a pharmacy transaction (dispense medicines)
export const dispenseMedicines = async (req, res) => {
  try {
    const { prescriptionId, items, notes } = req.body;
    const pharmacistId = req.user.id;

    if (!prescriptionId) {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ message: "prescriptionId is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(HTTP.BAD_REQUEST).json({
        message:
          "items must be a non-empty array of { medicineId, quantity, dispensedQty }",
      });
    }

    // Validate prescription exists
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [{ model: Patient, as: "patient" }],
    });
    if (!prescription) {
      return res
        .status(HTTP.NOT_FOUND)
        .json({ message: "Prescription not found" });
    }

    // Validate medicines exist and adjust stock
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const medicine = await Medicine.findByPk(item.medicineId);
      if (!medicine) {
        return res
          .status(HTTP.NOT_FOUND)
          .json({ message: `Medicine ${item.medicineId} not found` });
      }

      const qty = Number(item.dispensedQty) || 0;
      if (qty <= 0) {
        return res.status(HTTP.BAD_REQUEST).json({
          message: `Invalid quantity for ${medicine.name}`,
        });
      }

      // Check stock
      if (medicine.stock < qty) {
        return res.status(HTTP.BAD_REQUEST).json({
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`,
        });
      }

      // Deduct from stock
      await medicine.update({ stock: medicine.stock - qty });

      const itemTotal = qty * medicine.unit_price;
      totalAmount += itemTotal;

      processedItems.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: item.quantity || qty, // Original prescribed quantity
        dispensedQty: qty,
        unitPrice: Number(medicine.unit_price),
        totalPrice: Number(itemTotal),
      });
    }

    // Create pharmacy transaction
    const transaction = await PharmacyTransaction.create({
      prescription_id: prescriptionId,
      pharmacist_id: pharmacistId,
      patient_id: prescription.patient_id,
      items: processedItems,
      status: "fulfilled",
      total_amount: totalAmount,
      notes: notes || null,
      fulfilled_at: new Date(),
    });

    const serialized = await PharmacyTransaction.findByPk(transaction.id, {
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "pharmacist", include: [{ model: StaffProfile, as: "staffProfile" }] },
        {
          model: Prescription,
          as: "prescription",
          include: [{ model: Patient, as: "patient" }],
        },
      ],
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Medicines dispensed successfully",
      transaction: serializeTransaction(serialized),
    });
  } catch (err) {
    console.error("[pharmacy/dispense]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /pharmacy/transactions — get pharmacy transactions (with filters)
export const getPharmacyTransactions = async (req, res) => {
  try {
    const { status, patientId, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    if (patientId) where.patient_id = patientId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const transactions = await PharmacyTransaction.findAll({
      where,
      include: [
        { model: Patient, as: "patient" },
        {
          model: User,
          as: "pharmacist",
          include: [{ model: StaffProfile, as: "staffProfile" }],
        },
        {
          model: Prescription,
          as: "prescription",
          include: [
            { model: Patient, as: "patient" },
            {
              model: User,
              as: "doctor",
              include: [{ model: StaffProfile, as: "staffProfile" }],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      transactions: transactions.map(serializeTransaction),
    });
  } catch (err) {
    console.error("[pharmacy/transactions]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /pharmacy/reports/stats — pharmacy statistics for dashboard
export const getPharmacyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthStart = new Date(today);
    monthStart.setDate(1);

    // Today's stats
    const filledToday = await PharmacyTransaction.count({
      where: {
        status: "fulfilled",
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    // Pending prescriptions
    const allPrescriptions = await Prescription.findAll({
      include: [
        {
          model: PharmacyTransaction,
          as: "transactions",
          attributes: ["status"],
          required: false,
        },
      ],
    });

    const pendingCount = allPrescriptions.filter(
      (rx) =>
        !rx.transactions || rx.transactions.length === 0 || !rx.transactions.some((tx) => tx.status === "fulfilled"),
    ).length;

    // Low stock medicines
    const allMedicines = await Medicine.findAll({
      attributes: ["id", "stock", "reorder_threshold"],
    });
    const lowStockCount = allMedicines.filter(
      (m) => m.stock <= m.reorder_threshold,
    ).length;

    // Revenue
    const totalRevenue = await PharmacyTransaction.sum("total_amount", {
      where: {
        status: "fulfilled",
        createdAt: {
          [Op.gte]: monthStart,
        },
      },
    });

    // Transaction count
    const transactionCount = await PharmacyTransaction.count({
      where: {
        status: "fulfilled",
        createdAt: {
          [Op.gte]: monthStart,
        },
      },
    });

    return res.status(HTTP.OK).json({
      success: true,
      stats: {
        filledToday,
        pendingPrescriptions: pendingCount,
        lowStockItems: lowStockCount,
        monthlyRevenue: Number(totalRevenue || 0),
        totalTransactions: transactionCount,
      },
    });
  } catch (err) {
    console.error("[pharmacy/stats]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /pharmacy/reports — detailed pharmacy reports
export const getPharmacyReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (reportType === "revenue") {
      const transactions = await PharmacyTransaction.findAll({
        where: {
          status: "fulfilled",
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        attributes: ["id", "total_amount", "createdAt"],
        include: [{ model: Patient, as: "patient", attributes: ["fullname"] }],
        order: [["createdAt", "DESC"]],
      });

      const total = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

      return res.status(HTTP.OK).json({
        success: true,
        report: {
          type: "revenue",
          period: { start, end },
          transactions: transactions.map((t) => ({
            id: t.id,
            patient: t.patient?.fullname,
            amount: Number(t.total_amount),
            date: t.createdAt,
          })),
          totalRevenue: total,
          transactionCount: transactions.length,
        },
      });
    }

    if (reportType === "inventory") {
      const medicines = await Medicine.findAll({
        attributes: [
          "id",
          "name",
          "stock",
          "reorder_threshold",
          "unit_price",
        ],
        order: [["stock", "ASC"]],
      });

      const lowStock = medicines.filter((m) => m.stock <= m.reorder_threshold);
      const inStock = medicines.filter((m) => m.stock > m.reorder_threshold);

      return res.status(HTTP.OK).json({
        success: true,
        report: {
          type: "inventory",
          totalSkus: medicines.length,
          lowStockCount: lowStock.length,
          inStockCount: inStock.length,
          lowStockItems: lowStock.map((m) => ({
            id: m.id,
            name: m.name,
            stock: m.stock,
            threshold: m.reorder_threshold,
          })),
        },
      });
    }

    if (reportType === "topMedicines") {
      // Aggregate medicines dispensed
      const transactions = await PharmacyTransaction.findAll({
        where: {
          status: "fulfilled",
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        attributes: ["items"],
        raw: true,
      });

      const medicineStats = {};
      transactions.forEach((t) => {
        t.items.forEach((item) => {
          if (!medicineStats[item.medicineId]) {
            medicineStats[item.medicineId] = {
              name: item.medicineName,
              totalDispensed: 0,
              revenue: 0,
            };
          }
          medicineStats[item.medicineId].totalDispensed += item.dispensedQty;
          medicineStats[item.medicineId].revenue += item.totalPrice;
        });
      });

      const topMedicines = Object.values(medicineStats)
        .sort((a, b) => b.totalDispensed - a.totalDispensed)
        .slice(0, 10);

      return res.status(HTTP.OK).json({
        success: true,
        report: {
          type: "topMedicines",
          period: { start, end },
          topMedicines: topMedicines.map((m) => ({
            name: m.name,
            quantityDispensed: m.totalDispensed,
            revenue: Number(m.revenue),
          })),
        },
      });
    }

    return res.status(HTTP.BAD_REQUEST).json({ message: "Invalid reportType" });
  } catch (err) {
    console.error("[pharmacy/reports]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /pharmacy/transactions/:id — get single transaction
export const getTransaction = async (req, res) => {
  try {
    const transaction = await PharmacyTransaction.findByPk(req.params.id, {
      include: [
        { model: Patient, as: "patient" },
        {
          model: User,
          as: "pharmacist",
          include: [{ model: StaffProfile, as: "staffProfile" }],
        },
        {
          model: Prescription,
          as: "prescription",
        },
      ],
    });

    if (!transaction) {
      return res
        .status(HTTP.NOT_FOUND)
        .json({ message: "Transaction not found" });
    }

    return res.status(HTTP.OK).json({
      success: true,
      transaction: serializeTransaction(transaction),
    });
  } catch (err) {
    console.error("[pharmacy/transaction/get]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
