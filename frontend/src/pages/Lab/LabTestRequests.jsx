import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  collected: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-500",
};

const STATUS_FILTERS = ["All", "pending", "collected", "completed"];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const StatusPill = ({ status }) => (
  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"}`}>
    {status}
  </span>
);

const ResultEntryRow = ({ onSave, onCancel, saving }) => {
  const [value, setValue] = useState("");
  const [critical, setCritical] = useState(false);

  return (
    <tr className="bg-white/2 border-b border-[#1a1a1a]">
      <td colSpan={6} className="px-5 py-4">
        <div className="flex flex-col gap-2.5 max-w-2xl">
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest">Result</label>
          <textarea
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter result value / findings"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm text-[#ccc] cursor-pointer w-fit">
            <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} className="accent-red-500" />
            Flag as critical value
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="border border-[#2a2a2a] text-[#888] rounded-md px-3 py-1.5 text-xs font-semibold hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => value.trim() && onSave({ result: value.trim(), critical })}
              disabled={saving || !value.trim()}
              className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save Result & Complete"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

const RequestRow = ({ req, onCollect, onStartResult, busy }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{req.patient?.name ?? "—"}</span>
      {req.patient?.identifier && <span className="block text-xs text-[#555]">{req.patient.identifier}</span>}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{req.doctor?.name ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{req.testType}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(req.requestedAt)}</td>
    <td className="px-5 py-3.5 text-sm align-middle"><StatusPill status={req.status} /></td>
    <td className="px-5 py-3.5 align-middle">
      {req.status === "pending" && (
        <button
          onClick={() => onCollect(req.id)}
          disabled={busy}
          className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          Log Collection
        </button>
      )}
      {req.status === "collected" && (
        <button
          onClick={() => onStartResult(req.id)}
          disabled={busy}
          className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          Enter Result
        </button>
      )}
      {req.status === "completed" && <span className="text-xs text-[#444]">—</span>}
    </td>
  </tr>
);

const LabTestRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [resultRowId, setResultRowId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const debounceRef = useRef(null);

  const fetchRequests = useCallback(async (statusFilter, searchTerm) => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await api.get("/lab-tests", { params });
      if (res.data?.success) setRequests(res.data.labTests);
    } catch (err) {
      console.warn("[LabTestRequests] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests(filter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRequests(filter, search), 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCollect = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/lab-tests/${id}/collect`);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "collected" } : r)));
    } catch (err) {
      console.error("[LabTestRequests] collect failed:", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveResult = async (id, payload) => {
    setBusyId(id);
    try {
      await api.patch(`/lab-tests/${id}/result`, payload);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "completed", result: payload.result, critical: payload.critical } : r)),
      );
      setResultRowId(null);
    } catch (err) {
      console.error("[LabTestRequests] result save failed:", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Test Requests</h2>
        {pendingCount > 0 && (
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            {pendingCount} awaiting collection
          </span>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium capitalize transition-colors duration-150 cursor-pointer ${
                filter === f ? "bg-green-500 border-green-500 text-black" : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name or patient ID…"
          className={`${inputClass} max-w-xs`}
        />
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Patient", "Requested By", "Test Type", "Requested", "Status", "Action"].map((h) => (
                <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/2 border-b border-[#1a1a1a]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">Loading requests…</td>
              </tr>
            )}
            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">No requests match this view.</td>
              </tr>
            )}
            {!loading &&
              requests.map((req) => (
                <Fragment key={req.id}>
                  <RequestRow
                    req={req}
                    busy={busyId === req.id}
                    onCollect={handleCollect}
                    onStartResult={(id) => setResultRowId(id)}
                  />
                  {resultRowId === req.id && (
                    <ResultEntryRow
                      saving={busyId === req.id}
                      onCancel={() => setResultRowId(null)}
                      onSave={(payload) => handleSaveResult(req.id, payload)}
                    />
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabTestRequests;