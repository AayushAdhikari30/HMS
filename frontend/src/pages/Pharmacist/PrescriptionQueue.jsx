import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import DataTable from "../../components/DataTable";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

const PrescriptionModal = ({ prescription, onClose, onDispense, loading }) => {
  const [dispensingItems, setDispensingItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (prescription?.medications) {
      setDispensingItems(
        prescription.medications.map((med) => ({
          name: med.name,
          prescribed: med.quantity || 1,
          dispensing: med.quantity || 1,
          medicineId: "",
        })),
      );
    }
  }, [prescription]);

  const handleDispense = async () => {
    setError("");
    setSuccess("");

    // Validate all medicines are selected
    if (dispensingItems.some((item) => !item.medicineId)) {
      setError("Please select a medicine for all medications");
      return;
    }

    try {
      await onDispense(prescription.id, dispensingItems, notes);
      setSuccess("Prescription dispensed successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispense");
    }
  };

  if (!prescription) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Dispense Prescription</h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Patient Info */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Patient Info</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#ccc]">
              <div>
                <span className="text-[#666]">Patient:</span> {prescription.patient?.name}
              </div>
              <div>
                <span className="text-[#666]">Doctor:</span> Dr.{" "}
                {prescription.doctor?.name}
              </div>
              <div className="col-span-2">
                <span className="text-[#666]">Diagnosis:</span> {prescription.diagnosis || "—"}
              </div>
              {prescription.notes && (
                <div className="col-span-2">
                  <span className="text-[#666]">Notes:</span> {prescription.notes}
                </div>
              )}
            </div>
          </div>

          {/* Medications to Dispense */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Medications ({dispensingItems.length})
            </h3>
            <div className="space-y-3">
              {dispensingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 flex flex-col gap-3"
                >
                  <div>
                    <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-1">
                      Medication {idx + 1}: {item.name}
                    </label>
                    <input
                      type="text"
                      placeholder="Select medicine..."
                      className={`${inputClass} text-sm`}
                      value={item.medicineId}
                      onChange={(e) => {
                        const updated = [...dispensingItems];
                        updated[idx].medicineId = e.target.value;
                        setDispensingItems(updated);
                      }}
                    />
                    <p className="text-xs text-[#666] mt-1">
                      Prescribed: {item.prescribed} | Dispensing: {item.dispensing}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-1">
                        Quantity to Dispense
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.dispensing}
                        onChange={(e) => {
                          const updated = [...dispensingItems];
                          updated[idx].dispensing = Number(e.target.value) || 1;
                          setDispensingItems(updated);
                        }}
                        className={`${inputClass} text-sm`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-2">
              Dispenser Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this dispensation..."
              className={`${inputClass} resize-none h-20`}
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
            <button
              onClick={handleDispense}
              disabled={loading}
              className="flex-1 bg-green-500 text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Dispensing..." : "Dispense Prescription"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-[#2a2a2a] text-[#ccc] font-semibold px-4 py-2.5 rounded-lg hover:border-[#3a3a3a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrescriptionRow = ({ prescription, onClick }) => (
  <tr
    onClick={() => onClick(prescription)}
    className="border-b border-[#1a1a1a] hover:bg-white/2 cursor-pointer transition-colors duration-100"
  >
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{prescription.patient?.name}</span>
      <span className="block text-xs text-[#666]">{prescription.id.slice(0, 8)}</span>
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      Dr. {prescription.doctor?.name}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      {prescription.diagnosis || "—"}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">
      {prescription.medications?.length || 0} item(s)
    </td>
    <td className="px-5 py-3.5 align-middle">
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
          prescription.fulfillmentStatus === "pending"
            ? "bg-red-500/10 text-red-400"
            : "bg-amber-500/10 text-amber-400"
        }`}
      >
        {prescription.fulfillmentStatus === "pending" ? "Pending" : "Partial"}
      </span>
    </td>
    <td className="px-5 py-3.5 text-xs text-[#666] align-middle">
      {new Date(prescription.createdAt).toLocaleDateString()}
    </td>
  </tr>
);

export default function PrescriptionQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispensing, setDispensing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pharmacy/prescriptions");
      if (res.data?.success) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      console.warn("[PrescriptionQueue] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleDispense = async (prescriptionId, items, notes) => {
    setDispensing(true);
    try {
      const res = await api.post("/pharmacy/dispense", {
        prescriptionId,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.prescribed,
          dispensedQty: item.dispensing,
        })),
        notes,
      });

      if (res.data?.success) {
        // Refresh prescriptions list
        await fetchPrescriptions();
        setSelectedPrescription(null);
      }
    } finally {
      setDispensing(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (filterStatus === "pending")
      return rx.fulfillmentStatus === "pending";
    if (filterStatus === "partial")
      return rx.fulfillmentStatus === "partially_fulfilled";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">
          Prescription Queue
        </h2>
        <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
          {prescriptions.filter((rx) => rx.fulfillmentStatus === "pending").length} pending
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`${inputClass} max-w-xs`}
        >
          <option value="all">All Prescriptions</option>
          <option value="pending">Pending Only</option>
          <option value="partial">Partially Fulfilled</option>
        </select>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-white/[0.01] text-xs font-semibold text-[#666] uppercase tracking-wider">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Diagnosis</th>
                <th className="px-5 py-3">Medications</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm text-[#666]">
                    Loading prescriptions...
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm text-[#666]">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <PrescriptionRow
                    key={prescription.id}
                    prescription={prescription}
                    onClick={setSelectedPrescription}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrescriptionModal
        prescription={selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        onDispense={handleDispense}
        loading={dispensing}
      />
    </div>
  );
}
