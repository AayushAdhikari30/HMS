import { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import api from "../api/axios";

const NAV_ITEMS = [
  { to: "/lab-dashboard", label: "Overview" },
  { to: "/lab-dashboard/queue", label: "Queue" },
  { to: "/lab-dashboard/completed", label: "Completed" },
];

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

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

const isToday = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

// ---------- Result submission modal ----------
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
        <div>
          <h3 className="text-base font-semibold text-white">Report Result — {test.testName}</h3>
          <p className="text-xs text-[#666] mt-0.5">Patient: {test.patient?.name ?? "—"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Result</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={5}
            placeholder="Enter findings / values / interpretation"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes for the patient"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#555] outline-none focus:border-green-500/60 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={onClose}
            className="border border-[#2a2a2a] text-[#999] rounded-lg px-4 py-2 text-sm font-semibold hover:border-[#444] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-500 text-black font-semibold text-sm rounded-lg px-4 py-2 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Sending report…" : "Send Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Shared row ----------
const TestRow = ({ test, onStart, onReport, showActions = true }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02]">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{test.testName}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{test.patient?.name ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      {test.orderedBy ? test.orderedBy.identifier : <span className="text-[#555]">Self-request</span>}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(test.createdAt)}</td>
    <td className="px-5 py-3.5 align-middle">
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[test.status] ?? "bg-white/5 text-[#888]"}`}>
        {STATUS_LABEL[test.status] ?? test.status}
      </span>
    </td>
    {showActions && (
      <td className="px-5 py-3.5 align-middle">
        <div className="flex gap-2">
          {test.status === "requested" && (
            <button
              onClick={() => onStart(test.id)}
              className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black cursor-pointer whitespace-nowrap"
            >
              Start
            </button>
          )}
          {(test.status === "requested" || test.status === "in_progress") && (
            <button
              onClick={() => onReport(test)}
              className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black cursor-pointer whitespace-nowrap"
            >
              Report
            </button>
          )}
        </div>
      </td>
    )}
  </tr>
);

// ---------- Data hook (shared across overview / queue / completed) ----------
const useLabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/labs");
      if (res.data?.success) setTests(res.data.labTests);
    } catch (err) {
      console.warn("[LabAssistant] fetch failed:", err.message);
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

  return { tests, loading, refetch: fetchTests, updateStatus };
};

// ---------- Pages ----------
const LabOverview = () => {
  const navigate = useNavigate();
  const { tests, loading } = useLabTests();

  const stats = useMemo(() => {
    const pending = tests.filter((t) => t.status === "requested").length;
    const inProgress = tests.filter((t) => t.status === "in_progress").length;
    const completedToday = tests.filter((t) => t.status === "completed" && isToday(t.completedAt)).length;
    return { pending, inProgress, completedToday, total: tests.length };
  }, [tests]);

  const recent = tests
    .filter((t) => t.status === "requested" || t.status === "in_progress")
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Lab Overview</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <MetricCard label="Pending" value={loading ? "…" : stats.pending} sub="Awaiting check-in" accent />
          <MetricCard label="In Progress" value={loading ? "…" : stats.inProgress} sub="Currently processing" />
          <MetricCard label="Completed Today" value={loading ? "…" : stats.completedToday} sub="Reports sent" />
          <MetricCard label="Total Tests" value={loading ? "…" : stats.total} sub="All time" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">Waiting on you</h2>
          <button
            onClick={() => navigate("/lab-dashboard/queue")}
            className="text-xs text-green-500 font-semibold hover:underline cursor-pointer"
          >
            Open full queue →
          </button>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          {loading && <p className="px-5 py-6 text-center text-sm text-[#666]">Loading…</p>}
          {!loading && recent.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-[#555]">Queue is clear. Nice work.</p>
          )}
          {!loading && recent.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Test", "Patient", "Ordered By", "Requested", "Status"].map((h) => (
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
                {recent.map((t) => (
                  <TestRow key={t.id} test={t} showActions={false} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

const LabQueue = () => {
  const { tests, loading, updateStatus } = useLabTests();
  const [filter, setFilter] = useState("active"); // active | requested | in_progress | all
  const [modalTest, setModalTest] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "active") return tests.filter((t) => t.status === "requested" || t.status === "in_progress");
    if (filter === "all") return tests.filter((t) => t.status !== "completed");
    return tests.filter((t) => t.status === filter);
  }, [tests, filter]);

  const handleStart = async (id) => {
    try {
      await updateStatus(id, { status: "in_progress" });
    } catch (err) {
      console.error("[LabQueue] start failed:", err.message);
    }
  };

  const FILTERS = [
    { key: "active", label: "Active" },
    { key: "requested", label: "Requested" },
    { key: "in_progress", label: "In Progress" },
    { key: "all", label: "All Open" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Test Queue</h2>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer ${
                filter === f.key
                  ? "bg-green-500 border-green-500 text-black"
                  : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Test", "Patient", "Ordered By", "Requested", "Status", "Actions"].map((h) => (
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
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  Loading queue…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  Nothing in this bucket.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((t) => (
                <TestRow key={t.id} test={t} onStart={handleStart} onReport={setModalTest} />
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

const LabCompleted = () => {
  const { tests, loading } = useLabTests();
  const [selected, setSelected] = useState(null);

  const completed = useMemo(
    () =>
      tests
        .filter((t) => t.status === "completed")
        .sort((a, b) => new Date(b.completedAt ?? 0) - new Date(a.completedAt ?? 0)),
    [tests],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Completed Reports</h2>
        {completed.length > 0 && (
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {completed.length} total
          </span>
        )}
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Test", "Patient", "Reported", "Sent At"].map((h) => (
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
                  Loading…
                </td>
              </tr>
            )}
            {!loading && completed.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#666]">
                  No completed reports yet.
                </td>
              </tr>
            )}
            {!loading &&
              completed.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] cursor-pointer"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{t.testName}</td>
                  <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{t.patient?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(t.completedAt)}</td>
                  <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatTime(t.completedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-2 text-sm text-[#ccc]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold text-white">{selected.testName}</h3>
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
            <span className="font-semibold text-white">Reported:</span> {formatDate(selected.completedAt)} at {formatTime(selected.completedAt)}
          </p>
          <div>
            <p className="font-semibold text-white mb-1">Result</p>
            <p className="whitespace-pre-wrap text-[#bbb]">{selected.result || "—"}</p>
          </div>
          {selected.notes && (
            <div>
              <p className="font-semibold text-white mb-1">Notes</p>
              <p className="whitespace-pre-wrap text-[#bbb]">{selected.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Router ---
export default function LabAssistantDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Lab Portal">
      <Routes>
        <Route index element={<LabOverview />} />
        <Route path="queue" element={<LabQueue />} />
        <Route path="completed" element={<LabCompleted />} />
      </Routes>
    </DashboardLayout>
  );
}
