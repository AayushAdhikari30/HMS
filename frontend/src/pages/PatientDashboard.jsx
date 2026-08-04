import { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import DataTable from "../components/DataTable";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";
import PatientLabTests from "./PatientLabTests";
import PatientReports from "./PatientReports";
import PatientBilling from "./PatientBilling";
import api from "../api/axios";

const NAV_ITEMS = [
  { to: "/patient-dashboard", label: "Overview" },
  { to: "/patient-dashboard/appointments", label: "Appointments" },
  { to: "/patient-dashboard/prescriptions", label: "Prescriptions" },
  { to: "/patient-dashboard/lab-tests", label: "Lab Tests" },
  { to: "/patient-dashboard/reports", label: "Reports" },
  { to: "/patient-dashboard/billing", label: "Billing" },
];

const CHECKUP_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "doctor", label: "Doctor" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status", type: "status" },
];

const STATUS_LABEL = { completed: "Completed", cancelled: "Cancelled", confirmed: "Confirmed", pending: "Pending" };

const shortDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

const longDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

const useOverviewData = () => {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, rxRes, labRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/prescriptions"),
        api.get("/labs"),
      ]);
      if (apptRes.data?.success) setAppointments(apptRes.data.appointments);
      if (rxRes.data?.success) setPrescriptions(rxRes.data.prescriptions);
      if (labRes.data?.success) setLabTests(labRes.data.labTests);
    } catch (err) {
      console.warn("[PatientOverview] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  return { appointments, prescriptions, labTests, loading };
};

const PatientOverview = () => {
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const { appointments, prescriptions, labTests, loading } = useOverviewData();

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = appointments
    .filter((a) => (a.status === "pending" || a.status === "confirmed") && a.appointmentDate >= today)
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  const nextAppt = upcoming[0];

  const pendingLabCount = labTests.filter((t) => t.status === "requested" || t.status === "in_progress").length;

  const latestRx = [...prescriptions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const metrics = [
    {
      label: "Next Appointment",
      value: nextAppt ? shortDate(nextAppt.appointmentDate) : "None",
      sub: nextAppt
        ? `${nextAppt.doctor?.name ?? "—"}${nextAppt.doctor?.department ? " · " + nextAppt.doctor.department : ""}`
        : "Nothing scheduled",
      accent: true,
    },
    {
      label: "Active Prescriptions",
      value: String(prescriptions.length),
      sub: latestRx ? `Last updated ${shortDate(latestRx.createdAt?.slice(0, 10))}` : "None on file",
    },
    {
      label: "Pending Reports",
      value: String(pendingLabCount),
      sub: pendingLabCount > 0 ? "Awaiting lab results" : "All caught up",
    },
  ];

  const checkupRows = appointments
    .filter((a) => a.status === "completed" || a.status === "cancelled")
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      date: longDate(a.appointmentDate),
      doctor: a.doctor?.name ?? "—",
      department: a.doctor?.department ?? "—",
      status: STATUS_LABEL[a.status] ?? a.status,
    }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Health at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} value={loading ? "…" : m.value} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">Recent Checkups</h2>
          {selectedCheckup && (
            <button
              onClick={() => setSelectedCheckup(null)}
              className="text-green-500 text-xs font-semibold hover:underline cursor-pointer"
            >
              Clear selection
            </button>
          )}
        </div>

        {!loading && checkupRows.length === 0 && (
          <p className="text-sm text-[#555] px-1">No past appointments yet.</p>
        )}
        {(loading || checkupRows.length > 0) && (
          <DataTable columns={CHECKUP_COLUMNS} rows={checkupRows} onRowAction={setSelectedCheckup} />
        )}

        {selectedCheckup && (
          <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-1.5 text-sm text-[#ccc]">
            <h3 className="text-sm font-bold text-white mb-1">Checkup Detail</h3>
            <p>
              <span className="font-semibold text-white">Date:</span> {selectedCheckup.date}
            </p>
            <p>
              <span className="font-semibold text-white">Doctor:</span> {selectedCheckup.doctor}
            </p>
            <p>
              <span className="font-semibold text-white">Department:</span> {selectedCheckup.department}
            </p>
            <p>
              <span className="font-semibold text-white">Status:</span> {selectedCheckup.status}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default function PatientDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Patient Dashboard">
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="lab-tests" element={<PatientLabTests />} />
        <Route path="reports" element={<PatientReports />} />
        <Route path="billing" element={<PatientBilling />} />
      </Routes>
    </DashboardLayout>
  );
}