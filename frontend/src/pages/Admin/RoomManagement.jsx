import { useState } from "react";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;
const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

const ROOM_TYPES = ["General Ward", "ICU", "Private", "Operation Theater"];
const STATUS_STYLES = {
  Available: "bg-green-500/10 text-green-500",
  Occupied: "bg-red-500/10 text-red-400",
  Maintenance: "bg-amber-500/10 text-amber-400",
};

// Mock data : replace with GET /rooms once the backend model exists
const INITIAL_ROOMS = [
  { id: "r1", number: "101", type: "General Ward", capacity: 4, status: "Available" },
  { id: "r2", number: "204", type: "ICU", capacity: 1, status: "Occupied" },
  { id: "r3", number: "305", type: "Private", capacity: 1, status: "Available" },
  { id: "r4", number: "OT-1", type: "Operation Theater", capacity: 1, status: "Maintenance" },
];

const StatusPill = ({ status }) => (
  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"}`}>
    {status}
  </span>
);

const AddRoomForm = ({ onAdd }) => {
  const [form, setForm] = useState({ number: "", type: ROOM_TYPES[0], capacity: 1 });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.number.trim()) {
      setError("Room number is required");
      return;
    }
    onAdd({ id: crypto.randomUUID(), ...form, capacity: Number(form.capacity) || 1, status: "Available" });
    setForm({ number: "", type: ROOM_TYPES[0], capacity: 1 });
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
      <div>
        <label className={labelClass}>Room Number</label>
        <input
          value={form.number}
          onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          placeholder="e.g. 102"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Type</label>
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputClass}>
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Capacity</label>
        <input
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          className={inputClass}
        />
      </div>
      {error && <div className="col-span-full text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</div>}
      <button
        type="submit"
        className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
      >
        Add Room
      </button>
    </form>
  );
};

const RoomManagement = () => {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [filter, setFilter] = useState("All");

  const cycleStatus = (id) => {
    const order = ["Available", "Occupied", "Maintenance"];
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] } : r)),
    );
  };

  const removeRoom = (id) => setRooms((prev) => prev.filter((r) => r.id !== id));

  const filtered = filter === "All" ? rooms : rooms.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-white tracking-tight">Room Management</h2>

      <AddRoomForm onAdd={(room) => setRooms((prev) => [room, ...prev])} />

      <div className="flex gap-2 flex-wrap">
        {["All", "Available", "Occupied", "Maintenance"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150 cursor-pointer ${
              filter === f ? "bg-green-500 border-green-500 text-black" : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
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
              {["Room", "Type", "Capacity", "Status", "Action"].map((h) => (
                <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/2 border-b border-[#1a1a1a]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-[#666]">No rooms match this filter.</td></tr>
            )}
            {filtered.map((room) => (
              <tr key={room.id} className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
                <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{room.number}</td>
                <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{room.type}</td>
                <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{room.capacity}</td>
                <td className="px-5 py-3.5 text-sm align-middle"><StatusPill status={room.status} /></td>
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex gap-2">
                    <button
                      onClick={() => cycleStatus(room.id)}
                      className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer whitespace-nowrap"
                    >
                      Cycle Status
                    </button>
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomManagement;