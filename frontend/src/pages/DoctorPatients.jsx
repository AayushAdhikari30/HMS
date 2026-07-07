import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

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
  requested: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  accepted: "bg-blue-500/10 text-blue-400",
};

const STATUS_LABEL = {
  requested: "Requested",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
  accepted: "Accepted",
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${
      STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"
    }`}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

// --- Inline "write prescription" form, tied to a patient (not a specific appointment) ---
const PrescribeEditor = ({ onSave, onDismiss, saving }) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState([{ ...EMPTY_MED }]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const updateMed = (idx, field, value) => {
    setMedications((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMed = () => setMedications((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (idx) => setMedications((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError("");
    const cleaned = medications
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name.length > 0);
    if (cleaned.length === 0) {
      setError("Add at least one medication with a name.");
      return;
    }
    try {
      await onSave({ diagnosis: diagnosis.trim() || undefined, medications: cleaned, notes: notes.trim() || undefined });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save prescription. Please try again.");
    }
  };

  return (
    <div className="bg-white/[0.02] border-t border-[#1a1a1a] px-6 py-5">
      <div className="flex flex-col gap-3 max-w-3xl">
        <h4 className="text-sm font-semibold text-white">Write Prescription</h4>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Diagnosis (optional)
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute pharyngitis"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest">Medications</label>
          {medications.map((med, idx) => (
            <div key={idx} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr_auto] gap-2 items-center">
              <input
                type="text"
                value={med.name}
                onChange={(e) => updateMed(idx, "name", e.target.value)}
                placeholder="Medicine name"
                className={inputClass}
              />
              <input
                type="text"
                value={med.dosage}
                onChange={(e) => updateMed(idx, "dosage", e.target.value)}
                placeholder="Dosage (500mg)"
                className={inputClass}
              />
              <input
                type="text"
                value={med.frequency}
                onChange={(e) => updateMed(idx, "frequency", e.target.value)}
                placeholder="Frequency (2x/day)"
                className={inputClass}
              />
              <input
                type="text"
                value={med.duration}
                onChange={(e) => updateMed(idx, "duration", e.target.value)}
                placeholder="Duration (5 days)"
                className={inputClass}
              />
              <input
                type="text"
                value={med.instructions}
                onChange={(e) => updateMed(idx, "instructions", e.target.value)}
                placeholder="Instructions (after meals)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeMed(idx)}
                disabled={medications.length === 1}
                className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Remove medication"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMed}
            className="self-start text-green-500 text-xs font-semibold hover:underline cursor-pointer"
          >
            + Add another medication
          </button>
        </div>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Follow-up instructions, warnings, etc."
            className={inputClass}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="border border-[#2a2a2a] text-[#888] rounded-md px-3 py-1.5 text-xs font-semibold hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500/10 text-green-500 border border-green-500/40 hover:bg-green-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Inline "request lab test" form, tied to a patient ---
const LabTestEditor = ({ onSave, onDismiss, saving }) => {
  const [testName, setTestName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!testName.trim()) {
      setError("Test name is required.");
      return;
    }
    try {
      await onSave({ testName: testName.trim(), notes: notes.trim() || undefined });
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit lab request. Please try again.");
    }
  };

  return (
    <div className="bg-white/[0.02] border-t border-[#1a1a1a] px-6 py-5">
      <div className="flex flex-col gap-3 max-w-xl">
        <h4 className="text-sm font-semibold text-white">Request Lab Test</h4>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Test Name
          </label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Complete Blood Count (CBC)"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Clinical context for the lab team"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="border border-[#2a2a2a] text-[#888] rounded-md px-3 py-1.5 text-xs font-semibold hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Submitting…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Inline "refer patient" form, tied to a patient ---
const ReferEditor = ({ doctors, onSave, onDismiss, saving }) => {
  const [referredDoctorId, setReferredDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!referredDoctorId) {
      setError("Choose a doctor to refer to.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason for referral is required.");
      return;
    }
    try {
      await onSave({ referredDoctorId, reason: reason.trim(), notes: notes.trim() || undefined });
    } catch (err) {
      setError(err.response?.data?.message || "Could not send referral. Please try again.");
    }
  };

  return (
    <div className="bg-white/[0.02] border-t border-[#1a1a1a] px-6 py-5">
      <div className="flex flex-col gap-3 max-w-xl">
        <h4 className="text-sm font-semibold text-white">Refer Patient</h4>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Refer To
          </label>
          <select
            value={referredDoctorId}
            onChange={(e) => setReferredDoctorId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select a doctor…</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.department ? ` · ${d.department}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Reason
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this patient being referred?"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional context for the receiving doctor"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="border border-[#2a2a2a] text-[#888] rounded-md px-3 py-1.5 text-xs font-semibold hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500/10 text-orange-400 border border-orange-500/40 hover:bg-orange-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Sending…" : "Send Referral"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Read-only view of this doctor's past prescriptions / lab requests / referrals for one patient ---
const MedicationMiniTable = ({ medications }) => (
  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden mt-2">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-3 py-2 bg-white/[0.02] border-b border-[#1a1a1a]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {medications.map((med, idx) => (
          <tr key={idx} className="border-b border-[#1a1a1a] last:border-none">
            <td className="px-3 py-2 text-sm font-medium text-[#ddd] align-middle">{med.name}</td>
            <td className="px-3 py-2 text-sm text-[#999] align-middle">{med.dosage || "—"}</td>
            <td className="px-3 py-2 text-sm text-[#999] align-middle">{med.frequency || "—"}</td>
            <td className="px-3 py-2 text-sm text-[#999] align-middle">{med.duration || "—"}</td>
            <td className="px-3 py-2 text-sm text-[#999] align-middle">{med.instructions || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PatientHistory = ({ prescriptions, labTests, referrals }) => (
  <div className="bg-white/[0.02] border-t border-[#1a1a1a] px-6 py-5">
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-white">Prescription History</h4>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-[#666]">No prescriptions written for this patient yet.</p>
        ) : (
          prescriptions.map((rx) => (
            <div key={rx.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h5 className="text-sm font-semibold text-white">{rx.diagnosis || "General prescription"}</h5>
                <span className="text-xs text-[#555]">{formatDateTime(rx.createdAt)}</span>
              </div>
              <MedicationMiniTable medications={rx.medications ?? []} />
              {rx.notes && (
                <p className="text-sm text-[#999] mt-2">
                  <span className="text-[#666] font-semibold">Notes: </span>
                  {rx.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-white">Lab Requests</h4>
        {labTests.length === 0 ? (
          <p className="text-sm text-[#666]">No lab tests requested for this patient yet.</p>
        ) : (
          labTests.map((t) => (
            <div
              key={t.id}
              className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 flex items-start justify-between flex-wrap gap-2"
            >
              <div>
                <h5 className="text-sm font-semibold text-white">{t.testName}</h5>
                {t.result && <p className="text-sm text-[#999] mt-1">{t.result}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={t.status} />
                <span className="text-xs text-[#555] whitespace-nowrap">{formatDateTime(t.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-white">Referrals Sent</h4>
        {referrals.length === 0 ? (
          <p className="text-sm text-[#666]">No referrals sent for this patient yet.</p>
        ) : (
          referrals.map((r) => (
            <div key={r.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h5 className="text-sm font-semibold text-white">
                  To {r.referredDoctor?.name ?? "—"}
                  {r.referredDoctor?.department ? ` · ${r.referredDoctor.department}` : ""}
                </h5>
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <span className="text-xs text-[#555] whitespace-nowrap">{formatDateTime(r.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-[#999] mt-1">{r.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const PatientRow = ({ patient, mode, busy, onSetMode, onSavePrescription, onSaveLabTest, onSaveReferral, prescriptions, labTests, referrals, doctors }) => (
  <>
    <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] transition-colors duration-100">
      <td className="px-5 py-3.5 text-sm align-middle">
        <span className="font-medium text-[#ddd]">{patient.name}</span>
      </td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{patient.phone || "—"}</td>
      <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{formatDate(patient.lastVisitDate)}</td>
      <td className="px-5 py-3.5 text-sm align-middle">
        <StatusPill status={patient.lastVisitStatus} />
      </td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{patient.rxCount}</td>
      <td className="px-5 py-3.5 align-middle">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onSetMode(mode === "view" ? null : "view")}
            className="border border-[#2a2a2a] text-[#ccc] rounded-md px-2.5 py-1 text-xs font-semibold hover:border-green-500/40 hover:text-green-500 transition-colors duration-150 cursor-pointer"
          >
            {mode === "view" ? "Close" : `View (${patient.rxCount})`}
          </button>
          <button
            onClick={() => onSetMode(mode === "prescribe" ? null : "prescribe")}
            disabled={busy}
            className="border border-purple-500/40 text-purple-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-purple-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {mode === "prescribe" ? "Close" : "Prescribe"}
          </button>
          <button
            onClick={() => onSetMode(mode === "lab" ? null : "lab")}
            disabled={busy}
            className="border border-cyan-500/40 text-cyan-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-cyan-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {mode === "lab" ? "Close" : "Request Lab Test"}
          </button>
          <button
            onClick={() => onSetMode(mode === "refer" ? null : "refer")}
            disabled={busy}
            className="border border-orange-500/40 text-orange-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-orange-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {mode === "refer" ? "Close" : "Refer"}
          </button>
        </div>
      </td>
    </tr>
    {mode === "view" && (
      <tr>
        <td colSpan={6} className="p-0">
          <PatientHistory prescriptions={prescriptions} labTests={labTests} referrals={referrals} />
        </td>
      </tr>
    )}
    {mode === "prescribe" && (
      <tr>
        <td colSpan={6} className="p-0">
          <PrescribeEditor saving={busy} onDismiss={() => onSetMode(null)} onSave={onSavePrescription} />
        </td>
      </tr>
    )}
    {mode === "lab" && (
      <tr>
        <td colSpan={6} className="p-0">
          <LabTestEditor saving={busy} onDismiss={() => onSetMode(null)} onSave={onSaveLabTest} />
        </td>
      </tr>
    )}
    {mode === "refer" && (
      <tr>
        <td colSpan={6} className="p-0">
          <ReferEditor doctors={doctors} saving={busy} onDismiss={() => onSetMode(null)} onSave={onSaveReferral} />
        </td>
      </tr>
    )}
  </>
);

const DoctorPatients = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({ patientId: null, mode: null });
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, rxRes, labRes, refRes, docRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/prescriptions"),
        api.get("/labs"),
        api.get("/referrals", { params: { direction: "sent" } }),
        api.get("/appointments/doctors"),
      ]);
      if (apptRes.data?.success) setAppointments(apptRes.data.appointments);
      if (rxRes.data?.success) setPrescriptions(rxRes.data.prescriptions);
      if (labRes.data?.success) setLabTests(labRes.data.labTests);
      if (refRes.data?.success) setReferrals(refRes.data.referrals);
      if (docRes.data?.success) setDoctors(docRes.data.doctors);
    } catch (err) {
      console.warn("[DoctorPatients] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Group this doctor's prescriptions / lab requests / referrals by patient
  const rxByPatient = useMemo(() => {
    const map = new Map();
    for (const rx of prescriptions) {
      if (!rx.patient?.id) continue;
      const list = map.get(rx.patient.id) ?? [];
      list.push(rx);
      map.set(rx.patient.id, list);
    }
    return map;
  }, [prescriptions]);

  const labsByPatient = useMemo(() => {
    const map = new Map();
    for (const t of labTests) {
      if (!t.patient?.id) continue;
      const list = map.get(t.patient.id) ?? [];
      list.push(t);
      map.set(t.patient.id, list);
    }
    return map;
  }, [labTests]);

  const referralsByPatient = useMemo(() => {
    const map = new Map();
    for (const r of referrals) {
      if (!r.patient?.id) continue;
      const list = map.get(r.patient.id) ?? [];
      list.push(r);
      map.set(r.patient.id, list);
    }
    return map;
  }, [referrals]);

  // Doctors this doctor can refer to (exclude self)
  const referrableDoctors = useMemo(
    () => doctors.filter((d) => d.id !== user?.id),
    [doctors, user?.id],
  );

  // Derive a distinct patient list from this doctor's appointment history
  const patients = useMemo(() => {
    const byId = new Map();
    for (const appt of appointments) {
      if (!appt.patient?.id) continue;
      const existing = byId.get(appt.patient.id);
      const apptTimestamp = `${appt.appointmentDate}T${(appt.startTime || "00:00").slice(0, 5)}`;
      if (!existing || apptTimestamp > existing.lastVisitTimestamp) {
        byId.set(appt.patient.id, {
          id: appt.patient.id,
          name: appt.patient.name,
          phone: appt.patient.phone,
          lastVisitDate: appt.appointmentDate,
          lastVisitStatus: appt.status,
          lastVisitTimestamp: apptTimestamp,
          visitCount: (existing?.visitCount ?? 0) + 1,
        });
      } else {
        existing.visitCount += 1;
      }
    }
    return Array.from(byId.values())
      .map((p) => ({ ...p, rxCount: rxByPatient.get(p.id)?.length ?? 0 }))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }, [appointments, rxByPatient]);

  const submitPrescription = async (patient, { diagnosis, medications, notes }) => {
    setBusyId(patient.id);
    try {
      await api.post("/prescriptions", { patientId: patient.id, diagnosis, medications, notes });
      await fetchAll();
      setExpanded({ patientId: null, mode: null });
    } catch (err) {
      console.error("[DoctorPatients] prescription failed:", err.message);
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const submitLabTest = async (patient, { testName, notes }) => {
    setBusyId(patient.id);
    try {
      await api.post("/labs", { patientId: patient.id, testName, notes });
      await fetchAll();
      setExpanded({ patientId: null, mode: null });
    } catch (err) {
      console.error("[DoctorPatients] lab request failed:", err.message);
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const submitReferral = async (patient, { referredDoctorId, reason, notes }) => {
    setBusyId(patient.id);
    try {
      await api.post("/referrals", { patientId: patient.id, referredDoctorId, reason, notes });
      await fetchAll();
      setExpanded({ patientId: null, mode: null });
    } catch (err) {
      console.error("[DoctorPatients] referral failed:", err.message);
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">My Patients</h2>
        {patients.length > 0 && (
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {patients.length} total
          </span>
        )}
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Patient", "Phone", "Last Visit", "Status", "Prescriptions", "Action"].map((h) => (
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
                  Loading patients…
                </td>
              </tr>
            )}
            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  No patients yet — they'll show up here once someone books with you.
                </td>
              </tr>
            )}
            {!loading &&
              patients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  mode={expanded.patientId === patient.id ? expanded.mode : null}
                  busy={busyId === patient.id}
                  onSetMode={(mode) => setExpanded({ patientId: mode ? patient.id : null, mode })}
                  onSavePrescription={(payload) => submitPrescription(patient, payload)}
                  onSaveLabTest={(payload) => submitLabTest(patient, payload)}
                  onSaveReferral={(payload) => submitReferral(patient, payload)}
                  prescriptions={rxByPatient.get(patient.id) ?? []}
                  labTests={labsByPatient.get(patient.id) ?? []}
                  referrals={referralsByPatient.get(patient.id) ?? []}
                  doctors={referrableDoctors}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorPatients;
