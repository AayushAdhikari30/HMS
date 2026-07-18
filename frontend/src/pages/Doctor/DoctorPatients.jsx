import { useState, useEffect, useCallback, useMemo } from "react";
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

const TEST_TYPES = [
    "Complete Blood Count",
    "Lipid Panel",
    "Blood Glucose",
    "Liver Function Test",
    "Kidney Function Test",
    "Thyroid Panel",
    "Urinalysis",
    "Chest X-Ray",
    "MRI - Brain",
    "CT Scan",
    "ECG",
    "COVID-19 PCR",
    "Other",
];

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
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"
            }`}
    >
        {status}
    </span>
);

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

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

    const handleSave = () => {
        setError("");
        const cleaned = medications
            .map((m) => ({ ...m, name: m.name.trim() }))
            .filter((m) => m.name.length > 0);
        if (cleaned.length === 0) {
            setError("Add at least one medication with a name.");
            return;
        }
        onSave({ diagnosis: diagnosis.trim() || undefined, medications: cleaned, notes: notes.trim() || undefined });
    };

    return (
        <div className="bg-white/2 border-t border-[#1a1a1a] px-6 py-5">
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

const LabTestEditor = ({ onSave, onDismiss, saving }) => {
    const [testType, setTestType] = useState(TEST_TYPES[0]);
    const [customType, setCustomType] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    const handleSave = () => {
        setError("");
        const finalType = testType === "Other" ? customType.trim() : testType;
        if (!finalType) {
            setError("Please specify a test type.");
            return;
        }
        onSave({ testType: finalType, notes: notes.trim() || undefined });
    };

    return (
        <div className="bg-white/2 border-t border-[#1a1a1a] px-6 py-5">
            <div className="flex flex-col gap-3 max-w-lg">
                <h4 className="text-sm font-semibold text-white">Request Lab Test</h4>

                <div>
                    <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
                        Test Type
                    </label>
                    <select value={testType} onChange={(e) => setTestType(e.target.value)} className={inputClass}>
                        {TEST_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {testType === "Other" && (
                    <div>
                        <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
                            Specify Test
                        </label>
                        <input
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="e.g. HbA1c"
                            className={inputClass}
                        />
                    </div>
                )}

                <div>
                    <label className="text-[#888] text-xs font-semibold uppercase tracking-widest block mb-1.5">
                        Notes (optional)
                    </label>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Clinical context for the lab"
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
                        className="bg-blue-500/10 text-blue-400 border border-blue-500/40 hover:bg-blue-500 hover:text-black rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Sending…" : "Send Request"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MedicationMiniTable = ({ medications }) => (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden mt-2">
        <table className="w-full border-collapse">
            <thead>
                <tr>
                    {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map((h) => (
                        <th
                            key={h}
                            className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-3 py-2 bg-white/2 border-b border-[#1a1a1a]"
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

const PrescriptionHistory = ({ prescriptions }) => (
    <div className="bg-white/2 border-t border-[#1a1a1a] px-6 py-5">
        <div className="flex flex-col gap-4 max-w-3xl">
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
    </div>
);

const PatientRow = ({ patient, mode, busy, onSetMode, onSavePrescription, onSaveLabTest, prescriptions }) => (
    <>
        <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
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
                        onClick={() => onSetMode(mode === "labtest" ? null : "labtest")}
                        disabled={busy}
                        className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
                    >
                        {mode === "labtest" ? "Close" : "Request Lab Test"}
                    </button>
                </div>
            </td>
        </tr>
        {mode === "view" && (
            <tr>
                <td colSpan={6} className="p-0">
                    <PrescriptionHistory prescriptions={prescriptions} />
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
        {mode === "labtest" && (
            <tr>
                <td colSpan={6} className="p-0">
                    <LabTestEditor saving={busy} onDismiss={() => onSetMode(null)} onSave={onSaveLabTest} />
                </td>
            </tr>
        )}
    </>
);

const DoctorPatients = () => {
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({ patientId: null, mode: null });
    const [busyId, setBusyId] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [apptRes, rxRes] = await Promise.all([api.get("/appointments"), api.get("/prescriptions")]);
            if (apptRes.data?.success) setAppointments(apptRes.data.appointments);
            if (rxRes.data?.success) setPrescriptions(rxRes.data.prescriptions);
        } catch (err) {
            console.warn("[DoctorPatients] fetch failed:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAll();
    }, [fetchAll]);

    // Group this doctor's prescriptions by patient
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
        } finally {
            setBusyId(null);
        }
    };

    const submitLabTest = async (patient, { testType, notes }) => {
        setBusyId(patient.id);
        try {
            await api.post("/lab-tests", { patientId: patient.id, testType, notes });
            setExpanded({ patientId: null, mode: null });
        } catch (err) {
            console.error("[DoctorPatients] lab test request failed:", err.message);
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
                                    prescriptions={rxByPatient.get(patient.id) ?? []}
                                />
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoctorPatients;