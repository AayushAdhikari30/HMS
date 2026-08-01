import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import MetricCard from "../components/MetricCard";

const STATUS_STYLES = {
  unpaid: "bg-amber-500/10 text-amber-400",
  partial: "bg-blue-500/10 text-blue-400",
  paid: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const formatMoney = (n) => `Rs ${Number(n ?? 0).toFixed(2)}`;
const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

const emptyItem = () => ({ description: "", quantity: 1, unitPrice: 0 });

const NewInvoiceForm = ({ patients, onCreated }) => {
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.quantity || 0) * Number(it.unitPrice || 0),
    0,
  );
  const total = Math.max(0, subtotal + Number(tax || 0) - Number(discount || 0));

  const updateItem = (idx, patch) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!patientId) {
      setError("Choose a patient.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/invoices", {
        patientId,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
        tax: Number(tax || 0),
        discount: Number(discount || 0),
        notes: notes || undefined,
        dueDate: dueDate || undefined,
      });
      if (res.data?.success) {
        setPatientId("");
        setItems([emptyItem()]);
        setTax(0);
        setDiscount(0);
        setNotes("");
        setDueDate("");
        onCreated?.(res.data.invoice);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Create Invoice</h3>
        <span className="text-xs text-[#666]">Total: {formatMoney(total)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Patient</span>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          >
            <option value="">Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullname}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Due Date (optional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Line Items</span>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[1fr,80px,110px,auto] gap-2 items-center">
            <input
              placeholder="Description"
              value={it.description}
              onChange={(e) => updateItem(idx, { description: e.target.value })}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
            />
            <input
              type="number"
              min="1"
              value={it.quantity}
              onChange={(e) => updateItem(idx, { quantity: e.target.value })}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              value={it.unitPrice}
              onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              disabled={items.length === 1}
              className="text-red-400 disabled:text-[#333] disabled:cursor-not-allowed hover:text-red-300 cursor-pointer text-xs font-semibold px-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          className="self-start text-green-500 text-xs font-semibold hover:underline cursor-pointer"
        >
          + Add item
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Tax</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Discount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          />
        </label>
        <div className="flex flex-col gap-1.5 justify-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Subtotal</span>
          <span className="text-sm text-[#ddd] font-semibold py-2">{formatMoney(subtotal)}</span>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Notes (optional)</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none resize-none"
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-500 text-black text-sm font-semibold rounded-lg px-5 py-2 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {submitting ? "Creating…" : "Create Invoice"}
        </button>
      </div>
    </form>
  );
};

const InvoiceRow = ({ invoice, onCancel }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02]">
    <td className="px-5 py-3 text-sm align-middle font-mono text-xs text-[#666]">{invoice.invoiceNumber}</td>
    <td className="px-5 py-3 text-sm align-middle text-[#ddd]">{invoice.patient?.name ?? "—"}</td>
    <td className="px-5 py-3 text-sm align-middle text-[#ddd]">{formatMoney(invoice.total)}</td>
    <td className="px-5 py-3 text-sm align-middle text-[#ddd]">{formatMoney(invoice.amountPaid)}</td>
    <td className="px-5 py-3 text-sm align-middle text-[#ddd]">{formatMoney(invoice.balance)}</td>
    <td className="px-5 py-3 text-sm align-middle">
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[invoice.status]}`}>
        {invoice.status}
      </span>
    </td>
    <td className="px-5 py-3 text-sm align-middle text-[#999]">{formatDate(invoice.createdAt)}</td>
    <td className="px-5 py-3 align-middle">
      {invoice.status !== "paid" && invoice.status !== "cancelled" && invoice.amountPaid === 0 && (
        <button
          onClick={() => onCancel(invoice.id)}
          className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white cursor-pointer"
        >
          Void
        </button>
      )}
    </td>
  </tr>
);

const AdminBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, statsRes, patRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/invoices/stats"),
        api.get("/users?role=patient"),
      ]);
      if (invRes.data?.success) setInvoices(invRes.data.invoices);
      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (patRes.data?.success) {
        // API returns users; extract patient-role users with a linked patientProfile-ish name
        const users = patRes.data.users ?? [];
        setPatients(
          users
            .filter((u) => u.role === "patient")
            .map((u) => ({ id: u.patientId ?? u.id, fullname: u.name ?? u.identifier, userId: u.id })),
        );
      }
    } catch (err) {
      console.warn("[AdminBilling] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id) => {
    try {
      await api.patch(`/invoices/${id}/cancel`);
      fetchAll();
    } catch (err) {
      console.error("[AdminBilling] cancel failed:", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Billing Overview</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <MetricCard label="Billed" value={formatMoney(stats?.billed)} sub="Lifetime" accent />
          <MetricCard label="Collected" value={formatMoney(stats?.collected)} sub="Paid" />
          <MetricCard label="Outstanding" value={formatMoney(stats?.outstanding)} sub="Awaiting payment" />
          <MetricCard
            label="Unpaid Invoices"
            value={(stats?.counts?.unpaid ?? 0) + (stats?.counts?.partial ?? 0)}
            sub="Includes partial"
          />
        </div>
      </section>

      <NewInvoiceForm patients={patients} onCreated={fetchAll} />

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">All Invoices</h2>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Invoice #", "Patient", "Total", "Paid", "Balance", "Status", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/[0.02] border-b border-[#1a1a1a]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-sm text-[#666]">
                    Loading invoices…
                  </td>
                </tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-sm text-[#666]">
                    No invoices yet.
                  </td>
                </tr>
              )}
              {!loading &&
                invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} onCancel={handleCancel} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminBilling;
