import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;
const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTimeLabel = (t) => {
  if (!t) return "—";
  const [hStr, m] = t.slice(0, 5).split(":");
  const hour = Number(hStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${period}`;
};

const formatDateLabel = (iso) => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const todayIso = () => new Date().toISOString().slice(0, 10);

// --- Weekly availability ---
const AvailabilityForm = ({ onAdded }) => {
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/doctors/availability", {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        slotDurationMinutes: Number(slotDurationMinutes) || 30,
      });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className={labelClass}>Day</label>
        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className={inputClass}>
          {DAY_NAMES.map((name, idx) => (
            <option key={idx} value={idx}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Start Time</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>End Time</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Slot Length (min)</label>
        <input
          type="number"
          min={5}
          step={5}
          value={slotDurationMinutes}
          onChange={(e) => setSlotDurationMinutes(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <div className="col-span-full text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}
      <div className="col-span-full flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
        >
          {saving ? "Adding…" : "Add Availability Window"}
        </button>
      </div>
    </form>
  );
};

const AvailabilityRow = ({ item, onDelete, deleting }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{DAY_NAMES[item.day_of_week]}</td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">
      {formatTimeLabel(item.start_time)} – {formatTimeLabel(item.end_time)}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{item.slot_duration_minutes} min</td>
    <td className="px-5 py-3.5 align-middle">
      <button
        onClick={() => onDelete(item.id)}
        disabled={deleting === item.id}
        className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
      >
        {deleting === item.id ? "Removing…" : "Remove"}
      </button>
    </td>
  </tr>
);

// --- Time off ---
const TimeOffForm = ({ onAdded }) => {
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/doctors/time-off", { date, reason: reason.trim() || undefined });
      setReason("");
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add time off");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-end">
      <div>
        <label className={labelClass}>Date</label>
        <input
          type="date"
          min={todayIso()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Reason (optional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Conference, personal leave"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
      >
        {saving ? "Adding…" : "Block This Day"}
      </button>
      {error && (
        <div className="col-span-full text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}
    </form>
  );
};

const TimeOffRow = ({ item, onDelete, deleting }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{formatDateLabel(item.date)}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{item.reason || "—"}</td>
    <td className="px-5 py-3.5 align-middle">
      <button
        onClick={() => onDelete(item.id)}
        disabled={deleting === item.id}
        className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
      >
        {deleting === item.id ? "Removing…" : "Remove"}
      </button>
    </td>
  </tr>
);

const DoctorSchedule = () => {
  const [availability, setAvailability] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingAvailId, setDeletingAvailId] = useState(null);
  const [deletingTimeOffId, setDeletingTimeOffId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [availRes, timeOffRes] = await Promise.all([
        api.get("/doctors/availability"),
        api.get("/doctors/time-off"),
      ]);
      if (availRes.data?.success) setAvailability(availRes.data.availability);
      if (timeOffRes.data?.success) setTimeOff(timeOffRes.data.timeOff);
    } catch (err) {
      console.warn("[DoctorSchedule] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const deleteAvailability = async (id) => {
    setDeletingAvailId(id);
    try {
      await api.delete(`/doctors/availability/${id}`);
      setAvailability((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("[DoctorSchedule] delete availability failed:", err.message);
    } finally {
      setDeletingAvailId(null);
    }
  };

  const deleteTimeOff = async (id) => {
    setDeletingTimeOffId(id);
    try {
      await api.delete(`/doctors/time-off/${id}`);
      setTimeOff((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("[DoctorSchedule] delete time-off failed:", err.message);
    } finally {
      setDeletingTimeOffId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Weekly Availability</h2>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <AvailabilityForm onAdded={fetchAll} />
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Day", "Hours", "Slot Length", "Action"].map((h) => (
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
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#666]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && availability.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#666]">
                    No weekly hours set yet. Add one above — patients can't book until you do.
                  </td>
                </tr>
              )}
              {!loading &&
                availability.map((item) => (
                  <AvailabilityRow
                    key={item.id}
                    item={item}
                    onDelete={deleteAvailability}
                    deleting={deletingAvailId}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Time Off</h2>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <TimeOffForm onAdded={fetchAll} />
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Date", "Reason", "Action"].map((h) => (
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
                  <td colSpan={3} className="px-5 py-6 text-center text-sm text-[#666]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && timeOff.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-sm text-[#666]">
                    No days blocked off.
                  </td>
                </tr>
              )}
              {!loading &&
                timeOff.map((item) => (
                  <TimeOffRow key={item.id} item={item} onDelete={deleteTimeOff} deleting={deletingTimeOffId} />
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DoctorSchedule;