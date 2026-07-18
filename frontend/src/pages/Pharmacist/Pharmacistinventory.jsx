import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

const formatMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

const StockPill = ({ medicine }) => {
  if (medicine.outOfStock) {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-red-500/10 text-red-400">
        Out of stock
      </span>
    );
  }
  if (medicine.lowStock) {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-500/10 text-amber-400">
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-green-500/10 text-green-500">
      In stock
    </span>
  );
};

// --- Inline restock / dispense control ---
const StockAdjuster = ({ medicine, onAdjust, busy }) => {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(10);
  const [error, setError] = useState("");

  const submit = async (delta) => {
    setError("");
    try {
      await onAdjust(medicine.id, delta);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to adjust stock");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-[#2a2a2a] text-[#ccc] rounded-md px-2.5 py-1 text-xs font-semibold hover:border-green-500/40 hover:text-green-500 transition-colors duration-150 cursor-pointer whitespace-nowrap"
      >
        Adjust Stock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-white outline-none focus:border-green-500"
      />
      <button
        disabled={busy}
        onClick={() => submit(Number(qty) || 0)}
        className="border border-green-500/40 text-green-500 rounded-md px-2 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
        title="Receive stock"
      >
        + Receive
      </button>
      <button
        disabled={busy}
        onClick={() => submit(-(Number(qty) || 0))}
        className="border border-red-500/40 text-red-400 rounded-md px-2 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
        title="Dispense stock"
      >
        − Dispense
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setError("");
        }}
        className="text-[#666] hover:text-white text-xs px-1 cursor-pointer"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-400 whitespace-nowrap">{error}</span>}
    </div>
  );
};

const MedicineRow = ({ medicine, onAdjust, busyId }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{medicine.name}</span>
      <span className="block text-xs text-[#666]">{medicine.genericName}</span>
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{medicine.location || "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      {[medicine.form, medicine.strength].filter(Boolean).join(" · ") || "—"}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{medicine.stock}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{medicine.reorderThreshold}</td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatMoney(medicine.unitPrice)}</td>
    <td className="px-5 py-3.5 align-middle">
      <StockPill medicine={medicine} />
    </td>
    <td className="px-5 py-3.5 align-middle">
      <StockAdjuster medicine={medicine} onAdjust={onAdjust} busy={busyId === medicine.id} />
    </td>
  </tr>
);

const PharmacistInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const debounceRef = useRef(null);

  const fetchMedicines = useCallback(async (params) => {
    setLoading(true);
    try {
      const query = {};
      if (params.search?.trim()) query.search = params.search.trim();
      if (params.sectionFilter && params.sectionFilter !== "All") query.section = params.sectionFilter;
      if (params.lowStockOnly) query.lowStock = "true";
      const res = await api.get("/medicines", { params: query });
      if (res.data?.success) setMedicines(res.data.medicines);
    } catch (err) {
      console.warn("[PharmacistInventory] fetch medicines failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    try {
      const res = await api.get("/medicines/sections");
      if (res.data?.success) setSections(res.data.sections);
    } catch (err) {
      console.warn("[PharmacistInventory] fetch sections failed:", err.message);
    }
  }, []);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMedicines({ search, sectionFilter, lowStockOnly });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, sectionFilter, lowStockOnly, fetchMedicines]);

  const handleAdjust = async (id, delta) => {
    setBusyId(id);
    try {
      const res = await api.patch(`/medicines/${id}/stock`, { delta });
      if (res.data?.success) {
        setMedicines((prev) => prev.map((m) => (m.id === id ? res.data.medicine : m)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const lowStockCount = medicines.filter((m) => m.lowStock).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Inventory</h2>
        {lowStockCount > 0 && (
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            {lowStockCount} low stock
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by medicine or generic name…"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className={`${inputClass} max-w-xs`}
        >
          <option value="All">All sections</option>
          {sections.map((s) => (
            <option key={s.section} value={s.section}>
              {s.section} ({s.count})
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#ccc] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="accent-amber-500"
          />
          Low stock only
        </label>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-white/[0.01] text-xs font-semibold text-[#666] uppercase tracking-wider">
                <th className="px-5 py-3">Medicine</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Form / Strength</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Min</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {loading && medicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-sm text-[#666]">
                    Loading inventory...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-sm text-[#666]">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((medicine) => (
                  <MedicineRow
                    key={medicine.id}
                    medicine={medicine}
                    onAdjust={handleAdjust}
                    busyId={busyId}
                    loading={loading}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacistInventory;
