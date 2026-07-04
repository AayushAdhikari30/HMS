import { useState } from "react";
import api from "../api/axios";

const ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "lab_assistant", label: "Lab Assistant" },
  { value: "admin", label: "Admin" },
];

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;
const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";


const CreatedStaffBanner = ({ result, onDismiss }) => (
  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-5 py-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-green-400">Staff account created</h3>
      <button onClick={onDismiss} className="text-xs text-[#888] hover:text-white cursor-pointer">
        Dismiss
      </button>
    </div>
    <p className="text-sm text-[#ccc]">
      <span className="text-[#888]">Login ID:</span>{" "}
      <span className="font-mono text-white">{result.staff.identifier}</span>
    </p>
    <p className="text-sm text-[#ccc]">
      <span className="text-[#888]">Temporary password:</span>{" "}
      <span className="font-mono text-white">{result.tempPassword}</span>
    </p>
    <p className="text-xs text-amber-400">
      ⚠ This password is shown only once. Copy it now and share it with{" "}
      {result.staff.name} directly — it cannot be viewed again.
    </p>
  </div>
);

const AddStaffForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    fullName: "",
    role: "doctor",
    phone: "",
    department: "",
    specialization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/staff", form);
      if (res.data.success) {
        setResult(res.data);
        setForm({ fullName: "", role: "doctor", phone: "", department: "", specialization: "" });
        onCreated?.(res.data.staff);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create staff account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-white tracking-tight">Add Staff Member</h2>

      {result && <CreatedStaffBanner result={result} onDismiss={() => setResult(null)} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className={labelClass}>Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Dr. Ramesh Karki"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange} className={inputClass}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>Phone (optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="98XXXXXXXX"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>Department (optional)</label>
          <input
            id="department"
            name="department"
            type="text"
            value={form.department}
            onChange={handleChange}
            placeholder="Cardiology"
            className={inputClass}
          />
        </div>

        {form.role === "doctor" && (
          <div className="col-span-2">
            <label htmlFor="specialization" className={labelClass}>Specialization (optional)</label>
            <input
              id="specialization"
              name="specialization"
              type="text"
              value={form.specialization}
              onChange={handleChange}
              placeholder="Interventional Cardiology"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <div className="col-span-2 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="
              bg-green-500/10 text-green-500 border border-green-500/40
              hover:bg-green-500 hover:text-black hover:border-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded-lg px-5 py-2.5 text-sm font-semibold
              transition-all duration-200 cursor-pointer
            "
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStaffForm;
