import { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import MetricCard from "../../components/MetricCard";
import api from "../../api/axios";

const NAV_ITEMS = [
  { to: "/pharmacist-dashboard", label: "Overview" },
  { to: "/pharmacist-dashboard/inventory", label: "Inventory" },
  { to: "/pharmacist-dashboard/locate", label: "Find Medicine" },
  { to: "/pharmacist-dashboard/prescriptions", label: "Prescriptions" },
];

const formatMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

// ── Stock adjust modal ──────────────────────────────────────────────
const AdjustStockModal = ({ medicine, onClose, onSaved }) => {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const change = Number(delta);
    if (!Number.isInteger(change) || change === 0) {
      setError("Enter a non-zero whole number. Use a minus sign to dispense.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.patch(`/medicines/${medicine.id}/stock`, { delta: change });
      if (res.data?.success) onSaved(res.data.medicine);
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
        className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-4 max-w-md w-full"
      >
        <div>
          <h3 className="text-base font-semibold text-white">Adjust Stock — {medicine.name}</h3>
          <p className="text-xs text-[#666] mt-0.5">
            {medicine.genericName} · {medicine.location} · Current: {medicine.stock}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Change (positive receives · negative dispenses)</span>
          <input
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. 50 or -3"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500/60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. new shipment, dispensed to Sanjay G."
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500/60"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end mt-1">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#2a2a2a] text-[#999] rounded-lg px-4 py-2 text-sm font-semibold hover:border-[#444] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-500 text-black font-semibold text-sm rounded-lg px-4 py-2 hover:bg-green-400 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Shared inventory data hook ───────────────────────────────────────
const useMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/medicines");
      if (res.data?.success) setMedicines(res.data.medicines);
    } catch (err) {
      console.warn("[Pharmacist] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const replaceOne = (updated) =>
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

  return { medicines, loading, refetch: fetchAll, replaceOne };
};

// ── Overview ─────────────────────────────────────────────────────────
const PharmacistOverview = () => {
  const navigate = useNavigate();
  const { medicines, loading } = useMedicines();

  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStock = medicines.filter((m) => m.lowStock).length;
    const outOfStock = medicines.filter((m) => m.outOfStock).length;
    const inventoryValue = medicines.reduce((sum, m) => sum + m.stock * m.unitPrice, 0);
    return { total, lowStock, outOfStock, inventoryValue };
  }, [medicines]);

  const lowStockList = medicines.filter((m) => m.lowStock).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Pharmacy at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <MetricCard label="Total SKUs" value={loading ? "…" : stats.total} sub="Catalogue size" accent />
          <MetricCard label="Low Stock" value={loading ? "…" : stats.lowStock} sub="At or below threshold" />
          <MetricCard label="Out of Stock" value={loading ? "…" : stats.outOfStock} sub="Reorder immediately" />
          <MetricCard label="Inventory Value" value={loading ? "…" : formatMoney(stats.inventoryValue)} sub="On-hand estimate" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">Low Stock Alerts</h2>
          <button
            onClick={() => navigate("/pharmacist-dashboard/inventory")}
            className="text-xs text-green-500 font-semibold hover:underline cursor-pointer"
          >
            Open inventory →
          </button>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          {loading && <p className="px-5 py-6 text-center text-sm text-[#666]">Loading…</p>}
          {!loading && lowStockList.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-[#555]">Stock levels look healthy.</p>
          )}
          {!loading && lowStockList.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Medicine", "Location", "On Hand", "Threshold", "Status"].map((h) => (
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
                {lowStockList.map((m) => (
                  <tr key={m.id} className="border-b border-[#1a1a1a] last:border-none">
                    <td className="px-5 py-3 text-sm text-[#ddd] font-medium">
                      {m.name}
                      <span className="text-[#666] text-xs ml-2">({m.genericName})</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#999] font-mono">{m.location}</td>
                    <td className="px-5 py-3 text-sm text-[#ddd]">{m.stock}</td>
                    <td className="px-5 py-3 text-sm text-[#999]">{m.reorderThreshold}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          m.outOfStock ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {m.outOfStock ? "Out of stock" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

// ── Inventory (searchable table with expandable rows) ────────────────
const InventoryRow = ({ m, onAdjust, expanded, onToggle }) => (
  <>
    <tr
      onClick={onToggle}
      className={`border-b border-[#1a1a1a] hover:bg-white/[0.02] cursor-pointer ${
        expanded ? "bg-white/[0.02]" : ""
      }`}
    >
      <td className="px-5 py-3 text-sm text-[#ddd] font-medium">
        <div className="flex items-center gap-2">
          <span className={`text-[#666] text-[10px] transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
          <span>{m.name}</span>
        </div>
        <div className="text-[10px] text-[#666] mt-0.5 ml-4">{m.genericName}</div>
      </td>
      <td className="px-5 py-3 text-xs text-[#999]">
        <div className="font-semibold text-green-500/90">{m.section}</div>
        <div className="text-[#666] font-mono">{[m.aisle, m.shelf].filter(Boolean).join(" · ") || "—"}</div>
      </td>
      <td className="px-5 py-3 text-xs text-[#999]">
        {m.form ?? "—"}
        {m.strength ? <div className="text-[#666]">{m.strength}</div> : null}
      </td>
      <td className="px-5 py-3 text-sm text-[#ddd]">
        {m.stock}
        <div className="text-[10px] text-[#666]">threshold {m.reorderThreshold}</div>
      </td>
      <td className="px-5 py-3 text-sm text-[#ddd]">{formatMoney(m.unitPrice)}</td>
      <td className="px-5 py-3">
        {m.outOfStock ? (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400">
            Out
          </span>
        ) : m.lowStock ? (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">
            Low
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
            OK
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdjust(m);
          }}
          className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black cursor-pointer whitespace-nowrap"
        >
          Adjust
        </button>
      </td>
    </tr>
    {expanded && (
      <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <td colSpan={7} className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,240px] gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                Description
              </span>
              <p className="text-sm text-[#ccc] leading-relaxed">
                {m.description || "No description on file."}
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <span className="text-[#666]">Category: </span>
                <span className="text-[#ccc]">{m.category}</span>
              </div>
              <div>
                <span className="text-[#666]">Manufacturer: </span>
                <span className="text-[#ccc]">{m.manufacturer ?? "—"}</span>
              </div>
              <div>
                <span className="text-[#666]">Prescription: </span>
                <span className={m.requiresPrescription ? "text-amber-400" : "text-green-500"}>
                  {m.requiresPrescription ? "Required (Rx)" : "OTC"}
                </span>
              </div>
              {m.expiryDate && (
                <div>
                  <span className="text-[#666]">Expires: </span>
                  <span className="text-[#ccc]">{m.expiryDate}</span>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    )}
  </>
);

const InventoryPage = () => {
  const { medicines, loading, replaceOne } = useMedicines();
  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let list = medicines;
    if (showLowOnly) list = list.filter((m) => m.lowStock);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [medicines, search, showLowOnly]);

  const handleSaved = (updated) => {
    replaceOne(updated);
    setAdjusting(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Inventory</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or generic…"
            className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500 w-64"
          />
          <button
            onClick={() => setShowLowOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer ${
              showLowOnly
                ? "bg-amber-500 border-amber-500 text-black"
                : "border-[#2a2a2a] text-[#888] hover:border-amber-500/40 hover:text-amber-500"
            }`}
          >
            Low stock only
          </button>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Medicine", "Location", "Form", "Stock", "Unit Price", "Status", ""].map((h) => (
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
                <td colSpan={7} className="px-5 py-6 text-center text-sm text-[#666]">
                  Loading medicines…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-sm text-[#666]">
                  No medicines match this search.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((m) => (
                <InventoryRow
                  key={m.id}
                  m={m}
                  onAdjust={setAdjusting}
                  expanded={expandedId === m.id}
                  onToggle={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
                />
              ))}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <AdjustStockModal
          medicine={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

// ── Locate page (find where a medicine is stored) ─────────────────────
const LocatePage = () => {
  const { medicines, loading } = useMedicines();
  const [query, setQuery] = useState("");

  // Group by section so a pharmacist sees the whole cabinet at once
  const bySection = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map();
    for (const m of medicines) {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.genericName.toLowerCase().includes(q) &&
        !m.section.toLowerCase().includes(q) &&
        !(m.description ?? "").toLowerCase().includes(q)
      ) {
        continue;
      }
      if (!map.has(m.section)) map.set(m.section, []);
      map.get(m.section).push(m);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [medicines, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Find a Medicine</h2>
          <p className="text-xs text-[#666] mt-0.5">
            Search by name, generic, or section. Results are grouped by where they live.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: Amoxicillin, Cetirizine, Cardiovascular…"
          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500 w-80"
        />
      </div>

      {loading && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-16 px-8 text-center text-sm text-[#666]">
          Loading catalogue…
        </div>
      )}

      {!loading && bySection.length === 0 && (
        <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
          No matches. Try a different search.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {bySection.map(([section, items]) => (
          <div key={section} className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] bg-white/[0.02]">
              <div>
                <h3 className="text-sm font-semibold text-white">{section}</h3>
                <p className="text-[10px] text-[#666] uppercase tracking-widest mt-0.5">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                SECTION
              </span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Medicine", "Aisle / Shelf", "Form", "On Hand", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-5 py-2.5 border-b border-[#1a1a1a]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-b border-[#1a1a1a] last:border-none align-top">
                    <td className="px-5 py-3 text-sm text-[#ddd]">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[10px] text-[#666]">{m.genericName}</div>
                      {m.description && (
                        <div className="text-[11px] text-[#888] mt-1 leading-snug max-w-md">
                          {m.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-green-500/90">
                      {[m.aisle, m.shelf].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#999]">
                      {m.form ?? "—"}
                      {m.strength ? ` · ${m.strength}` : ""}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#ddd]">{m.stock}</td>
                    <td className="px-5 py-3">
                      {m.outOfStock ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">
                          Out
                        </span>
                      ) : m.lowStock ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                          Low
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Prescription queue (live data) ───────────────────────────────────
const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/prescriptions");
        if (!cancelled && res.data?.success) setPrescriptions(res.data.prescriptions);
      } catch (err) {
        console.warn("[Pharmacist prescriptions] fetch failed:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-white tracking-tight">Recent Prescriptions</h2>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Patient", "Doctor", "Diagnosis", "Meds", "Written"].map((h) => (
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
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-[#666]">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && prescriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-[#666]">
                  No prescriptions yet.
                </td>
              </tr>
            )}
            {!loading &&
              prescriptions.map((rx) => (
                <tr
                  key={rx.id}
                  onClick={() => setSelected(rx)}
                  className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] cursor-pointer"
                >
                  <td className="px-5 py-3 text-sm text-[#ddd]">{rx.patient?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-[#999]">{rx.doctor?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-[#999]">{rx.diagnosis ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-[#999]">
                    {(rx.medications ?? []).map((m) => m.name).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#999]">
                    {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-2 text-sm text-[#ccc]">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-bold text-white">
              {selected.diagnosis ?? "General prescription"}
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-[#666] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <p>
            <span className="font-semibold text-white">Patient:</span> {selected.patient?.name ?? "—"}
          </p>
          <p>
            <span className="font-semibold text-white">Doctor:</span> {selected.doctor?.name ?? "—"}
          </p>
          <div className="mt-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Medicine", "Dosage", "Frequency", "Duration"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-4 py-2 border-b border-[#1a1a1a]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selected.medications ?? []).map((m, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a] last:border-none">
                    <td className="px-4 py-2 text-sm text-[#ddd]">{m.name}</td>
                    <td className="px-4 py-2 text-sm text-[#999]">{m.dosage || "—"}</td>
                    <td className="px-4 py-2 text-sm text-[#999]">{m.frequency || "—"}</td>
                    <td className="px-4 py-2 text-sm text-[#999]">{m.duration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected.notes && (
            <p className="mt-2 text-[#999]">
              <span className="font-semibold text-white">Notes: </span>
              {selected.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Router ---
export default function PharmacistDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Pharmacy Dashboard">
      <Routes>
        <Route index element={<PharmacistOverview />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="locate" element={<LocatePage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
