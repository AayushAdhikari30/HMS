import { Op } from "sequelize";
import { Invoice, Patient, User } from "../models/index.js";
import { ROLES, HTTP, INVOICE_STATUS, INVOICE_STATUS_LIST, PAYMENT_METHOD_LIST, NOTIFICATION_TYPE } from "../constants.js";
import { notify } from "../services/notificationService.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

const toMoney = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? roundMoney(n) : NaN;
};

const serializeInvoice = (inv) => ({
  id: inv.id,
  invoiceNumber: inv.invoice_number,
  items: inv.items ?? [],
  subtotal: Number(inv.subtotal),
  tax: Number(inv.tax),
  discount: Number(inv.discount),
  total: Number(inv.total),
  amountPaid: Number(inv.amount_paid),
  balance: roundMoney(Number(inv.total) - Number(inv.amount_paid)),
  status: inv.status,
  paymentMethod: inv.payment_method,
  notes: inv.notes,
  dueDate: inv.due_date,
  paidAt: inv.paid_at,
  patient: inv.patient
    ? { id: inv.patient.id, name: inv.patient.fullname, phone: inv.patient.phone }
    : undefined,
  createdBy: inv.createdBy
    ? { id: inv.createdBy.id, identifier: inv.createdBy.identifier }
    : undefined,
  createdAt: inv.createdAt,
});

const invoiceInclude = [
  { model: Patient, as: "patient", required: false },
  { model: User, as: "createdBy", required: false, attributes: ["id", "identifier"] },
];

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "items must be a non-empty array";
  for (const it of items) {
    if (!it || typeof it.description !== "string" || !it.description.trim()) {
      return "each item needs a description";
    }
    const qty = Number(it.quantity);
    const unit = Number(it.unitPrice);
    if (!Number.isFinite(qty) || qty <= 0) return "each item needs a positive quantity";
    if (!Number.isFinite(unit) || unit < 0) return "each item needs a non-negative unitPrice";
  }
  return null;
};

const computeTotals = (items, tax, discount) => {
  const normalized = items.map((it) => {
    const quantity = Number(it.quantity);
    const unitPrice = roundMoney(it.unitPrice);
    const amount = roundMoney(quantity * unitPrice);
    return {
      description: it.description.trim(),
      quantity,
      unitPrice,
      amount,
    };
  });
  const subtotal = roundMoney(normalized.reduce((sum, it) => sum + it.amount, 0));
  const total = roundMoney(Math.max(0, subtotal + tax - discount));
  return { normalized, subtotal, total };
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}-${rand}`;
};

// POST /invoices — admin creates an invoice for a patient
export const createInvoice = async (req, res) => {
  try {
    const { patientId, items, tax, discount, notes, dueDate } = req.body;

    if (!patientId) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "patientId is required" });
    }

    const itemsError = validateItems(items);
    if (itemsError) return res.status(HTTP.BAD_REQUEST).json({ message: itemsError });

    const taxAmount = toMoney(tax);
    const discountAmount = toMoney(discount);
    if (Number.isNaN(taxAmount) || Number.isNaN(discountAmount)) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "tax and discount must be non-negative numbers" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) return res.status(HTTP.NOT_FOUND).json({ message: "Patient not found" });

    const { normalized, subtotal, total } = computeTotals(items, taxAmount, discountAmount);

    const invoice = await Invoice.create({
      invoice_number: generateInvoiceNumber(),
      patient_id: patient.id,
      created_by_id: req.user.id,
      items: normalized,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: total > 0 ? INVOICE_STATUS.UNPAID : INVOICE_STATUS.PAID,
      notes: notes || null,
      due_date: dueDate || null,
    });

    // Notify the patient that a new invoice awaits them
    notify({
      userId: patient.user_id,
      type: NOTIFICATION_TYPE.INVOICE,
      title: `New invoice ${invoice.invoice_number}`,
      body: `An invoice of $${total.toFixed(2)} has been issued to you.`,
      link: "/patient-dashboard/billing",
    });

    const created = await Invoice.findByPk(invoice.id, { include: invoiceInclude });
    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Invoice created",
      invoice: serializeInvoice(created),
    });
  } catch (err) {
    console.error("[invoices/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /invoices — scoped: patient sees own, admin sees all (optionally by status)
export const listInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && INVOICE_STATUS_LIST.includes(status)) where.status = status;

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) return res.status(HTTP.OK).json({ success: true, invoices: [] });
      where.patient_id = patient.id;
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP.FORBIDDEN).json({ message: "Access denied" });
    }

    const invoices = await Invoice.findAll({
      where,
      include: invoiceInclude,
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      invoices: invoices.map(serializeInvoice),
    });
  } catch (err) {
    console.error("[invoices/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /invoices/:id — patient sees own, admin sees any
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, { include: invoiceInclude });
    if (!invoice) return res.status(HTTP.NOT_FOUND).json({ message: "Invoice not found" });

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient || invoice.patient_id !== patient.id) {
        return res.status(HTTP.NOT_FOUND).json({ message: "Invoice not found" });
      }
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP.FORBIDDEN).json({ message: "Access denied" });
    }

    return res.status(HTTP.OK).json({ success: true, invoice: serializeInvoice(invoice) });
  } catch (err) {
    console.error("[invoices/get]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// POST /invoices/:id/payments — record a payment; patient (self) or admin
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    const amountPaidNow = toMoney(amount);
    if (Number.isNaN(amountPaidNow) || amountPaidNow <= 0) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "amount must be a positive number" });
    }
    if (paymentMethod && !PAYMENT_METHOD_LIST.includes(paymentMethod)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `paymentMethod must be one of: ${PAYMENT_METHOD_LIST.join(", ")}`,
      });
    }

    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(HTTP.NOT_FOUND).json({ message: "Invoice not found" });

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invoice is cancelled" });
    }
    if (invoice.status === INVOICE_STATUS.PAID) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invoice already paid" });
    }

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient || invoice.patient_id !== patient.id) {
        return res.status(HTTP.NOT_FOUND).json({ message: "Invoice not found" });
      }
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP.FORBIDDEN).json({ message: "Access denied" });
    }

    const newPaid = roundMoney(Number(invoice.amount_paid) + amountPaidNow);
    const total = Number(invoice.total);
    if (newPaid > total) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `Payment exceeds outstanding balance of $${(total - Number(invoice.amount_paid)).toFixed(2)}`,
      });
    }

    const nowPaid = newPaid >= total;
    await invoice.update({
      amount_paid: newPaid,
      status: nowPaid ? INVOICE_STATUS.PAID : INVOICE_STATUS.PARTIAL,
      payment_method: paymentMethod ?? invoice.payment_method,
      paid_at: nowPaid ? new Date() : invoice.paid_at,
    });

    // Notify admins on payment; notify the patient on their own action too (confirmation)
    const patient = await Patient.findByPk(invoice.patient_id);
    if (patient?.user_id) {
      notify({
        userId: patient.user_id,
        type: NOTIFICATION_TYPE.INVOICE,
        title: nowPaid ? `Invoice ${invoice.invoice_number} paid` : `Payment received on ${invoice.invoice_number}`,
        body: `$${amountPaidNow.toFixed(2)} recorded. Balance: $${(total - newPaid).toFixed(2)}.`,
        link: "/patient-dashboard/billing",
      });
    }
    const admins = await User.findAll({ where: { role: ROLES.ADMIN, is_active: true }, attributes: ["id"] });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          type: NOTIFICATION_TYPE.INVOICE,
          title: `Payment on ${invoice.invoice_number}`,
          body: `$${amountPaidNow.toFixed(2)} paid${nowPaid ? " · fully settled" : ""}.`,
          link: "/admin-dashboard/billing",
        }),
      ),
    );

    const refreshed = await Invoice.findByPk(invoice.id, { include: invoiceInclude });
    return res.status(HTTP.OK).json({ success: true, invoice: serializeInvoice(refreshed) });
  } catch (err) {
    console.error("[invoices/pay]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /invoices/:id/cancel — admin voids an unpaid invoice
export const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(HTTP.NOT_FOUND).json({ message: "Invoice not found" });

    if (Number(invoice.amount_paid) > 0) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Cannot cancel an invoice with payments recorded" });
    }
    if (invoice.status === INVOICE_STATUS.PAID) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invoice already paid" });
    }

    await invoice.update({ status: INVOICE_STATUS.CANCELLED });

    const patient = await Patient.findByPk(invoice.patient_id);
    if (patient?.user_id) {
      notify({
        userId: patient.user_id,
        type: NOTIFICATION_TYPE.INVOICE,
        title: `Invoice ${invoice.invoice_number} cancelled`,
        body: "This invoice has been voided.",
        link: "/patient-dashboard/billing",
      });
    }

    return res.status(HTTP.OK).json({ success: true, message: "Invoice cancelled" });
  } catch (err) {
    console.error("[invoices/cancel]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /invoices/stats — admin summary (counts + revenue)
export const invoiceStats = async (_req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { status: { [Op.ne]: INVOICE_STATUS.CANCELLED } },
      attributes: ["status", "total", "amount_paid"],
    });
    const summary = invoices.reduce(
      (acc, inv) => {
        const total = Number(inv.total);
        const paid = Number(inv.amount_paid);
        acc.billed += total;
        acc.collected += paid;
        acc.outstanding += Math.max(0, total - paid);
        acc.counts[inv.status] = (acc.counts[inv.status] ?? 0) + 1;
        return acc;
      },
      { billed: 0, collected: 0, outstanding: 0, counts: {} },
    );
    summary.billed = roundMoney(summary.billed);
    summary.collected = roundMoney(summary.collected);
    summary.outstanding = roundMoney(summary.outstanding);
    return res.status(HTTP.OK).json({ success: true, stats: summary });
  } catch (err) {
    console.error("[invoices/stats]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
