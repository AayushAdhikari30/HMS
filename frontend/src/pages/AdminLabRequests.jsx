import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const STATUS_STYLES = {
  requested: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const STATUS_LABEL = {
  requested: "Requested",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_FILTERS = ["All", "requested", "in_progress", "completed", "cancelled"];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const ResultModal = ({ test, onClose, onSubmit }) => {
  const [result, setResult] = useState(test.result || "");
  const [notes, setNotes] = useState(test.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!result.trim()) {
      setError("Result is required to complete this test.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(test.id, { status: "completed", result: result.trim(), notes: notes.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save result.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-lg flex flex-col gap-4">
        <h3 className="text-base font-semibold text-white">Complete Lab Test — {test.testName}</h3>
        <p className="text-xs text-[#666]">Patient: {test.patient?.name ?? "—"}</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#888]">Result</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={4}
            placeholder="Enter the lab result / findings"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 transition-colors duration-150 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#888]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes for the patient"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 transition-colors duration-150 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={onClose}
            className="border border-[#2a2a2a] text-[#999] rounded-lg px-4 py-2 text-sm font-semibold hover:border-[#444] transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-500 text-black font-semibold text-sm rounded-lg px-4 py-2 hover:bg-green-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Saving…" : "Mark Completed"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LabRequestRow = ({ test, onStart, onComplete }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{test.testName}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{test.patient?.name ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(test.createdAt)}</td>
    <td className="px-5 py-3.5 align-middle">
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${STATUS_STYLES[test.status] ?? "bg-white/5 text-[#888]"}`}>
        {STATUS_LABEL[test.status] ?? test.status}
      </span>
    </td>
    <td className="px-5 py-3.5 align-middle">
      <div className="flex gap-2">
        {test.status === "requested" && (
          <button
            onClick={() => onStart(test.id)}
            className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            Start
          </button>
        )}
        {(test.status === "requested" || test.status === "in_progress") && (
          <button
            onClick={() => onComplete(test)}
            className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            Complete
          </button>
        )}
        {(test.status === "completed" || test.status === "cancelled") && (
          <span className="text-xs text-[#555]">—</span>
        )}
      </div>
    </td>
  </tr>
);

const AdminLabRequests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [modalTest, setModalTest] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/labs");
      if (res.data?.success) setTests(res.data.labTests);
    } catch (err) {
      console.warn("[AdminLabRequests] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const updateStatus = async (id, payload) => {
    const res = await api.patch(`/labs/${id}/status`, payload);
    if (res.data?.success) {
      setTests((prev) => prev.map((t) => (t.id === id ? res.data.labTest : t)));
    }
  };

  const handleStart = async (id) => {
    try {
      await updateStatus(id, { status: "in_progress" });
    } catch (err) {
      console.error("[AdminLabRequests] start failed:", err.message);
    }
  };

  const filtered = filter === "All" ? tests : tests.filter((t) => t.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Lab Requests</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150 cursor-pointer ${
                filter === f
                  ? "bg-green-500 border-green-500 text-black"
                  : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
              }`}
            >
              {f === "All" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Test", "Patient", "Requested", "Status", "Actions"].map((h) => (
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
                  Loading requests…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-[#666]">
                  No lab requests match this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((t) => (
                <LabRequestRow key={t.id} test={t} onStart={handleStart} onComplete={setModalTest} />
              ))}
          </tbody>
        </table>
      </div>

      {modalTest && (
        <ResultModal test={modalTest} onClose={() => setModalTest(null)} onSubmit={updateStatus} />
      )}
    </div>
  );
};

export default AdminLabRequests;
