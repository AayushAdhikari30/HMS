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

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const ResultPanel = ({ test }) => (
  <tr>
    <td colSpan={4} className="p-0">
      <div className="bg-white/[0.02] border-t border-[#1a1a1a] px-6 py-5">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold text-white">{test.testName} — Result</h4>
            <span className="text-xs text-[#555]">Completed {formatDate(test.completedAt)}</span>
          </div>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-1.5">Result</p>
            <p className="text-sm text-[#ddd] whitespace-pre-wrap">{test.result}</p>
          </div>
          {test.notes && (
            <p className="text-sm text-[#999]">
              <span className="text-[#666] font-semibold">Notes: </span>
              {test.notes}
            </p>
          )}
        </div>
      </div>
    </td>
  </tr>
);

const RequestForm = ({ onCreated }) => {
  const [testName, setTestName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testName.trim()) {
      setError("Test name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/labs", { testName: testName.trim(), notes: notes.trim() || undefined });
      if (res.data?.success) {
        setTestName("");
        setNotes("");
        onCreated();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-4"
    >
      <h2 className="text-base font-semibold text-white tracking-tight">Check In for a Lab Test</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#888]">Test Name</label>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g. Complete Blood Count (CBC)"
          className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 transition-colors duration-150"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#888]">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any symptoms or context for the lab team"
          rows={3}
          className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 transition-colors duration-150 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start bg-green-500 text-black font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-green-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Submitting…" : "Check In"}
      </button>
    </form>
  );
};

const LabTestRow = ({ test, onCancel, expanded, onToggleView }) => (
  <>
    <tr className="border-b border-[#1a1a1a] last:border-none">
      <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{test.testName}</td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(test.createdAt)}</td>
      <td className="px-5 py-3.5 align-middle">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${STATUS_STYLES[test.status] ?? "bg-white/5 text-[#888]"}`}>
          {STATUS_LABEL[test.status] ?? test.status}
        </span>
      </td>
      <td className="px-5 py-3.5 align-middle">
        {test.status === "requested" && (
          <button
            onClick={() => onCancel(test.id)}
            className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
        )}
        {test.status === "completed" && (
          <button
            onClick={() => onToggleView(test.id)}
            className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer"
          >
            {expanded ? "Hide Result" : "View Result"}
          </button>
        )}
        {(test.status === "in_progress" || test.status === "cancelled") && (
          <span className="text-xs text-[#555]">—</span>
        )}
      </td>
    </tr>
    {expanded && test.status === "completed" && <ResultPanel test={test} />}
  </>
);

const PatientLabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/labs");
      if (res.data?.success) setTests(res.data.labTests);
    } catch (err) {
      console.warn("[PatientLabTests] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCancel = async (id) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)));
    try {
      await api.delete(`/labs/${id}`);
    } catch (err) {
      console.error("[PatientLabTests] cancel failed:", err.message);
      fetchTests();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <RequestForm onCreated={fetchTests} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white tracking-tight">Your Lab Requests</h2>
          {tests.length > 0 && (
            <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
              {tests.length} total
            </span>
          )}
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Test", "Requested", "Status", "Actions"].map((h) => (
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
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#666]">
                    Loading requests…
                  </td>
                </tr>
              )}
              {!loading && tests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#666]">
                    No lab requests yet. Check in above to request a test.
                  </td>
                </tr>
              )}
              {!loading &&
                tests.map((t) => (
                  <LabTestRow
                    key={t.id}
                    test={t}
                    onCancel={handleCancel}
                    expanded={expandedId === t.id}
                    onToggleView={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PatientLabTests;
