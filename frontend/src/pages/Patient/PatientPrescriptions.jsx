import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const MedicationTable = ({ medications }) => (
  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden mt-3">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["Medicine", "Dosage", "Frequency", "Duration", "Instructions"].map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-bold uppercase tracking-widest text-[#666] px-4 py-2.5 bg-white/2 border-b border-[#1a1a1a]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {medications.map((med, idx) => (
          <tr key={idx} className="border-b border-[#1a1a1a] last:border-none">
            <td className="px-4 py-2.5 text-sm font-medium text-[#ddd] align-middle">{med.name}</td>
            <td className="px-4 py-2.5 text-sm text-[#999] align-middle">{med.dosage || "—"}</td>
            <td className="px-4 py-2.5 text-sm text-[#999] align-middle">{med.frequency || "—"}</td>
            <td className="px-4 py-2.5 text-sm text-[#999] align-middle">{med.duration || "—"}</td>
            <td className="px-4 py-2.5 text-sm text-[#999] align-middle">{med.instructions || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PrescriptionCard = ({ rx }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-2">
    <div className="flex items-start justify-between flex-wrap gap-2">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {rx.diagnosis || "General prescription"}
        </h3>
        <p className="text-xs text-[#666] mt-0.5">
          {rx.doctor?.name ?? "Doctor"}
          {rx.doctor?.department ? ` · ${rx.doctor.department}` : ""}
        </p>
      </div>
      <span className="text-xs text-[#555] whitespace-nowrap">{formatDate(rx.createdAt)}</span>
    </div>

    <MedicationTable medications={rx.medications ?? []} />

    {rx.notes && (
      <p className="text-sm text-[#999] mt-2">
        <span className="text-[#666] font-semibold">Notes: </span>
        {rx.notes}
      </p>
    )}
  </div>
);

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/prescriptions");
      if (res.data?.success) setPrescriptions(res.data.prescriptions);
    } catch (err) {
      console.warn("[PatientPrescriptions] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Prescriptions</h2>
        {prescriptions.length > 0 && (
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {prescriptions.length} total
          </span>
        )}
      </div>

      {loading && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-16 px-8 text-center text-sm text-[#666]">
          Loading prescriptions…
        </div>
      )}

      {!loading && prescriptions.length === 0 && (
        <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
          No prescriptions yet. Your doctor will add one after a visit.
        </div>
      )}

      {!loading &&
        prescriptions.map((rx) => <PrescriptionCard key={rx.id} rx={rx} />)}
    </div>
  );
};

export default PatientPrescriptions;