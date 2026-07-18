import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  confirmed: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const STATUS_FILTERS = ["All", "pending", "confirmed", "completed", "cancelled"];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (t) => {
  if (!t) return "—";
  const [hStr, m] = t.slice(0, 5).split(":");
  const hour = Number(hStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${period}`;
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${
      STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"
    }`}
  >
    {status}
  </span>
);

// --- Inline "mark complete" notes editor ---
const CompleteEditor = ({ onSave, onDismiss, saving }) => {
  const [notes, setNotes] = useState("");
  return (
    <tr className="bg-white/2 border-b border-[#1a1a1a]">
      <td colSpan={6} className="px-5 py-4">
        <div className="flex flex-col gap-2.5">
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest">
            Visit notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Diagnosis, follow-up instructions, etc."
            className={inputClass}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onDismiss}
              className="border border-[#2a2a2a] text-[#888] rounded-md px-3 py-1.5 text-xs font-semibold hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(notes)}
              disabled={saving}
              className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save & Complete"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

const AppointmentRow = ({ appt, onUpdateStatus, onStartComplete, busyId }) => {
  const busy = busyId === appt.id;

  return (
    <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
      <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatDate(appt.appointmentDate)}</td>
      <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatTime(appt.startTime)}</td>
      <td className="px-5 py-3.5 text-sm align-middle">
        <span className="font-medium text-[#ddd]">{appt.patient?.name ?? "—"}</span>
        {appt.patient?.phone && <span className="block text-xs text-[#666]">{appt.patient.phone}</span>}
      </td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle max-w-55 truncate">
        {appt.reason || "—"}
      </td>
      <td className="px-5 py-3.5 text-sm align-middle">
        <StatusPill status={appt.status} />
      </td>
      <td className="px-5 py-3.5 align-middle">
        <div className="flex gap-2 flex-wrap">
          {appt.status === "pending" && (
            <>
              <button
                onClick={() => onUpdateStatus(appt.id, "confirmed")}
                disabled={busy}
                className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, "cancelled")}
                disabled={busy}
                className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          {appt.status === "confirmed" && (
            <>
              <button
                onClick={() => onStartComplete(appt.id)}
                disabled={busy}
                className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Mark Complete
              </button>
              <button
                onClick={() => onUpdateStatus(appt.id, "cancelled")}
                disabled={busy}
                className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          {(appt.status === "completed" || appt.status === "cancelled") && (
            <span className="text-xs text-[#444]">—</span>
          )}
        </div>
      </td>
    </tr>
  );
};

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      if (res.data?.success) setAppointments(res.data.appointments);
    } catch (err) {
      console.warn("[DoctorAppointments] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id, status, notes) => {
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status, notes });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status, notes: notes ?? a.notes } : a)),
      );
      setCompletingId(null);
    } catch (err) {
      console.error("[DoctorAppointments] status update failed:", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(
    () => (filter === "All" ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter],
  );

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Appointments</h2>
        {pendingCount > 0 && (
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            {pendingCount} awaiting confirmation
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium capitalize transition-colors duration-150 cursor-pointer ${
              filter === f
                ? "bg-green-500 border-green-500 text-black"
                : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Date", "Time", "Patient", "Reason", "Status", "Action"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/2 border-b border-[#1a1a1a]"
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
                  Loading appointments…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  No appointments in this view.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((appt) => (
                <Fragment key={appt.id}>
                  <AppointmentRow
                    appt={appt}
                    busyId={busyId}
                    onUpdateStatus={(id, status) => updateStatus(id, status)}
                    onStartComplete={(id) => setCompletingId(id)}
                  />
                  {completingId === appt.id && (
                    <CompleteEditor
                      saving={busyId === appt.id}
                      onDismiss={() => setCompletingId(null)}
                      onSave={(notes) => updateStatus(appt.id, "completed", notes)}
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

export default DoctorAppointments;