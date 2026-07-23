import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const STATUS_STYLES = {
  unpaid: "bg-amber-500/10 text-amber-400",
  partial: "bg-blue-500/10 text-blue-400",
  paid: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const PAYMENT_METHODS = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "insurance", label: "Insurance" },
  { value: "online", label: "Online" },
];

const formatMoney = (n) => `Rs ${Number(n ?? 0).toFixed(2)}`;
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";

const PaymentModal = ({ invoice, onClose, onPaid }) => {
  const [amount, setAmount] = useState(invoice.balance);
  const [method, setMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amount: Number(amount),
        paymentMethod: method,
      });
      onPaid();
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-5 max-w-md w-full"
      >
        <div>
          <h3 className="text-base font-semibold text-white">Pay Invoice</h3>
          <p className="text-xs text-[#666] mt-1">
            {invoice.invoiceNumber} · Balance {formatMoney(invoice.balance)}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Amount</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={invoice.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Method</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-[#ddd] focus:border-green-500 outline-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#2a2a2a] text-[#888] text-sm font-medium rounded-lg px-4 py-2 hover:border-[#444] hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-500 text-black text-sm font-semibold rounded-lg px-5 py-2 hover:bg-green-400 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Processing…" : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

const InvoiceCard = ({ invoice, onPay }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-4">
    <div className="flex items-start justify-between flex-wrap gap-2">
      <div>
        <h3 className="text-sm font-semibold text-white font-mono">{invoice.invoiceNumber}</h3>
        <p className="text-xs text-[#666] mt-0.5">
          Issued {formatDate(invoice.createdAt)}
          {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
        </p>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[invoice.status]}`}>
        {invoice.status}
      </span>
    </div>

    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Description", "Qty", "Unit", "Amount"].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-4 py-2 bg-white/[0.02] border-b border-[#1a1a1a]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(invoice.items ?? []).map((it, idx) => (
            <tr key={idx} className="border-b border-[#1a1a1a] last:border-none">
              <td className="px-4 py-2 text-sm text-[#ddd]">{it.description}</td>
              <td className="px-4 py-2 text-sm text-[#999]">{it.quantity}</td>
              <td className="px-4 py-2 text-sm text-[#999]">{formatMoney(it.unitPrice)}</td>
              <td className="px-4 py-2 text-sm text-[#ddd]">{formatMoney(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <div>
        <span className="text-[#666]">Subtotal</span>
        <p className="text-sm text-[#ddd] font-semibold">{formatMoney(invoice.subtotal)}</p>
      </div>
      <div>
        <span className="text-[#666]">Tax</span>
        <p className="text-sm text-[#ddd] font-semibold">{formatMoney(invoice.tax)}</p>
      </div>
      <div>
        <span className="text-[#666]">Discount</span>
        <p className="text-sm text-[#ddd] font-semibold">-{formatMoney(invoice.discount)}</p>
      </div>
      <div>
        <span className="text-[#666]">Total</span>
        <p className="text-sm text-white font-bold">{formatMoney(invoice.total)}</p>
      </div>
    </div>

    {invoice.status !== "cancelled" && (
      <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-4">
        <div className="text-sm">
          <span className="text-[#666]">Balance: </span>
          <span className="font-bold text-white">{formatMoney(invoice.balance)}</span>
          {invoice.amountPaid > 0 && (
            <span className="text-[#666] ml-2">({formatMoney(invoice.amountPaid)} paid)</span>
          )}
        </div>
        {invoice.status !== "paid" && (
          <button
            onClick={() => onPay(invoice)}
            className="bg-green-500 text-black text-sm font-semibold rounded-lg px-4 py-2 hover:bg-green-400 cursor-pointer"
          >
            Pay {formatMoney(invoice.balance)}
          </button>
        )}
      </div>
    )}
  </div>
);

const PatientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      if (res.data?.success) setInvoices(res.data.invoices);
    } catch (err) {
      console.warn("[PatientBilling] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePaid = () => {
    setPayingInvoice(null);
    fetchInvoices();
  };

  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((acc, i) => acc + Number(i.balance), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Invoices</h2>
        {outstanding > 0 && (
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            {formatMoney(outstanding)} outstanding
          </span>
        )}
      </div>

      {loading && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-16 px-8 text-center text-sm text-[#666]">
          Loading invoices…
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
          No invoices yet.
        </div>
      )}

      {!loading && invoices.map((inv) => <InvoiceCard key={inv.id} invoice={inv} onPay={setPayingInvoice} />)}

      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
};

export default PatientBilling;
