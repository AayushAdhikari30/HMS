import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import DataTable from "../components/DataTable";

const NAV_ITEMS = [
  { to: "/patient-dashboard", label: "Overview" },
  { to: "/patient-dashboard/appointments", label: "Appointments" },
  { to: "/patient-dashboard/prescriptions", label: "Prescriptions" },
  { to: "/patient-dashboard/reports", label: "Reports" },
];

const METRICS = [
  { label: "Next Appointment", value: "Jun 18", sub: "Dr. Ramesh Karki · Cardiology", accent: true },
  { label: "Active Prescriptions", value: "3", sub: "Last updated Jun 10" },
  { label: "Pending Reports", value: "2", sub: "Awaiting lab results" },
];

const CHECKUP_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "doctor", label: "Doctor" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status", type: "status" },
];

const CHECKUP_DATA = [
  { id: 1, date: "Jun 05, 2026", doctor: "Dr. Ramesh Karki", department: "Cardiology", status: "Completed" },
  { id: 2, date: "May 22, 2026", doctor: "Dr. Sita Thapa", department: "General Medicine", status: "Completed" },
  { id: 3, date: "May 10, 2026", doctor: "Dr. Bikash Rai", department: "Neurology", status: "Completed" },
  { id: 4, date: "Apr 30, 2026", doctor: "Dr. Puja Shrestha", department: "Dermatology", status: "Cancelled" },
];

const Placeholder = ({ label }) => (
  <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
    {label} · Coming Soon
  </div>
);

const PatientOverview = () => {
  const [selectedCheckup, setSelectedCheckup] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Health at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {METRICS.map((m) => (
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

        <DataTable columns={CHECKUP_COLUMNS} rows={CHECKUP_DATA} onRowAction={setSelectedCheckup} />

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

// --- PatientDashboard Router ---
export default function PatientDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Patient Dashboard">
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="appointments" element={<Placeholder label="Appointments" />} />
        <Route path="prescriptions" element={<Placeholder label="Prescriptions" />} />
        <Route path="reports" element={<Placeholder label="Reports" />} />
      </Routes>
    </DashboardLayout>
  );
}