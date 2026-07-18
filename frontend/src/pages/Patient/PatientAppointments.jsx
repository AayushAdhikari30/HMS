import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;
const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  confirmed: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

const todayIso = () => new Date().toISOString().slice(0, 10);

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
  const [hStr, m] = t.split(":");
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

// --- Booking panel ---
const BookAppointmentPanel = ({ onBooked }) => {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/appointments/doctors");
        if (res.data?.success) setDoctors(res.data.doctors);
      } catch (err) {
        console.warn("[BookAppointmentPanel] failed to load doctors:", err.message);
      }
    })();
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot("");
    try {
      const res = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
      setSlots(res.data?.slots ?? []);
    } catch (err) {
      setSlots([]);
      console.warn("[BookAppointmentPanel] failed to load slots:", err.message);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSlots();
  }, [fetchSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!doctorId || !date || !selectedSlot) {
      setError("Please choose a doctor, date, and time slot.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/appointments", {
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot,
        reason: reason.trim() || undefined,
      });
      setSuccessMsg("Appointment requested! You'll see it below once the doctor confirms.");
      setReason("");
      setSelectedSlot("");
      fetchSlots();
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-white tracking-tight">Book an Appointment</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="doctorId" className={labelClass}>Doctor</label>
            <select
              id="doctorId"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.department ? `· ${d.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className={labelClass}>Date</label>
            <input
              id="date"
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <span className={labelClass}>Available Slots</span>
          {!doctorId && <p className="text-sm text-[#555]">Pick a doctor and date to see open slots.</p>}
          {doctorId && slotsLoading && <p className="text-sm text-[#555]">Loading slots…</p>}
          {doctorId && !slotsLoading && slots.length === 0 && (
            <p className="text-sm text-[#555]">No open slots for this date. Try another day.</p>
          )}
          {doctorId && !slotsLoading && slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    selectedSlot === slot
                      ? "bg-green-500 border-green-500 text-black"
                      : "border-[#2a2a2a] text-[#ccc] hover:border-green-500/40 hover:text-green-500"
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reason" className={labelClass}>Reason (optional)</label>
          <textarea
            id="reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for visit"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="text-sm text-green-500 bg-green-500/8 border border-green-500/20 rounded-lg px-4 py-2.5">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="
              bg-green-500/10 text-green-500 border border-green-500/40
              hover:bg-green-500 hover:text-black hover:border-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded-lg px-5 py-2.5 text-sm font-semibold
              transition-all duration-200 cursor-pointer
            "
          >
            {submitting ? "Booking…" : "Book Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Appointment row ---
const AppointmentRow = ({ appt, onCancel, cancelling }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatDate(appt.appointmentDate)}</td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatTime(appt.startTime?.slice(0, 5))}</td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{appt.doctor?.name ?? "—"}</span>
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{appt.doctor?.department ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <StatusPill status={appt.status} />
    </td>
    <td className="px-5 py-3.5 align-middle">
      {CANCELLABLE_STATUSES.includes(appt.status) ? (
        <button
          onClick={() => onCancel(appt.id)}
          disabled={cancelling === appt.id}
          className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelling === appt.id ? "Cancelling…" : "Cancel"}
        </button>
      ) : (
        <span className="text-xs text-[#444]">—</span>
      )}
    </td>
  </tr>
);

// --- Main page ---
const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments");
      if (res.data?.success) setAppointments(res.data.appointments);
    } catch (err) {
      console.warn("[PatientAppointments] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled", cancelledBy: "patient" } : a)),
      );
    } catch (err) {
      console.error("[PatientAppointments] cancel failed:", err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <BookAppointmentPanel onBooked={fetchAppointments} />

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Appointments</h2>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Date", "Time", "Doctor", "Department", "Status", "Action"].map((h) => (
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
              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                    No appointments yet. Book one above.
                  </td>
                </tr>
              )}
              {!loading &&
                appointments.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} onCancel={handleCancel} cancelling={cancelling} />
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PatientAppointments;