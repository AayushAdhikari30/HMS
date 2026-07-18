import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import MetricCard from "../../components/MetricCard";
import DataTable from "../../components/DataTable";
import api from "../../api/axios";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";
import PatientReports from "./PatientReports"

const NAV_ITEMS = [
  { to: "/patient-dashboard", label: "Overview" },
  { to: "/patient-dashboard/appointments", label: "Appointments" },
  { to: "/patient-dashboard/prescriptions", label: "Prescriptions" },
  { to: "/patient-dashboard/reports", label: "Reports" },
];

const CHECKUP_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "doctor", label: "Doctor" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status", type: "status" },
];



const PatientOverview = () => {
  const [metrics, setMetrics] = useState([
    { label: "Next Appointment", value: "—", sub: "None scheduled", accent: true },
    { label: "Active Prescriptions", value: "0", sub: "Currently active" },
    { label: "Lab Tests", value: "0", sub: "Pending results" },
  ]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch appointments
        const apptRes = await api.get("/appointments");
        if (apptRes.data?.success) {
          const appts = apptRes.data.appointments.map((appt) => ({
            id: appt.id,
            date: new Date(appt.appointmentDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            doctor: appt.doctor?.staffProfile?.fullname || appt.doctor?.identifier || "Unknown",
            department: appt.doctor?.staffProfile?.department || "—",
            status: appt.status,
          }));
          setAppointments(appts);

          // Find next appointment
          const nextAppt = appts.find((a) => a.status !== "cancelled");
          const nextLabel = nextAppt
            ? `${nextAppt.date} · ${nextAppt.doctor}`
            : "None scheduled";

          // Fetch prescriptions count
          const rxRes = await api.get("/prescriptions");
          const rxCount = rxRes.data?.success ? rxRes.data.prescriptions.length : 0;

          // Fetch lab tests count
          const labRes = await api.get("/lab-tests");
          const labCount = labRes.data?.success
            ? labRes.data.tests.filter((t) => t.status !== "completed").length
            : 0;

          setMetrics([
            {
              label: "Next Appointment",
              value: nextAppt?.date || "—",
              sub: nextLabel,
              accent: true,
            },
            {
              label: "Active Prescriptions",
              value: rxCount.toString(),
              sub: "Currently active",
            },
            { label: "Lab Tests", value: labCount.toString(), sub: "Pending results" },
          ]);
        }
      } catch (err) {
        console.warn("[PatientOverview] fetch failed:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Health at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
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

        {loading ? (
          <div className="text-center text-[#666] py-8">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center text-[#666] py-8">No appointments found</div>
        ) : (
          <>
            <DataTable columns={CHECKUP_COLUMNS} rows={appointments} onRowAction={setSelectedCheckup} />

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
          </>
        )}
      </section>
    </div>
  );
};

// --- PatientDashboard Router ---
export default function PatientDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Patient Dashboard">
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="reports" element={<PatientReports />} />
      </Routes>
    </DashboardLayout>
  );
}