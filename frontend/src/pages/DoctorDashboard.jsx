import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DataTable from "../components/DataTable";

const NAV_ITEMS = [
  { to: "/doctor-dashboard", icon: "", label: "Overview" },
  { to: "/doctor-dashboard/appointments", icon: "", label: "Appointments" },
  { to: "/doctor-dashboard/patients", icon: "", label: "My Patients" },
  { to: "/doctor-dashboard/schedule", icon: "", label: "Schedule" },
];

const QUEUE_COLUMNS = [
  { key: "patient", label: "Patient Name" },
  { key: "time", label: "Time" },
  { key: "type", label: "Visit Type" },
  { key: "status", label: "Status", type: "status" },
];

const QUEUE_DATA = [
  { id: 1, patient: "Sanjay Gurung", time: "09:00 AM", type: "Follow-up", status: "Completed" },
  { id: 2, patient: "Anita Sharma", time: "09:30 AM", type: "Consultation", status: "In Progress" },
  { id: 3, patient: "Bikram Magar", time: "10:00 AM", type: "New Patient", status: "Pending" },
  { id: 4, patient: "Priya Tamang", time: "10:30 AM", type: "Follow-up", status: "Pending" },
  { id: 5, patient: "Roshan KC", time: "11:00 AM", type: "Consultation", status: "Pending" },
];

const QUICK_ACTIONS = [
  { label: "Write Prescription", icon: "", description: "Create a new prescription for a patient" },
  { label: "View Schedule", icon: "", description: "Check your full weekly calendar" },
  { label: "Request Lab Test", icon: "", description: "Order diagnostic tests for a patient" },
  { label: "Refer Patient", icon: "↗", description: "Send a referral to another department" },
];

const Placeholder = ({ label }) => (
  <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
    {label} · Coming Soon
  </div>
);

const QuickActionPanel = ({ actions }) => (
  <div className="flex flex-col gap-4">
    <h2 className="text-base font-semibold text-white tracking-tight">Quick Actions</h2>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {actions.map(({ label, icon, description }) => (
        <button
          key={label}
          className="flex flex-col items-start gap-1.5 p-5 bg-[#111111] border border-[#1a1a1a] rounded-xl text-left cursor-pointer transition-all duration-150 hover:border-green-500/40 hover:shadow-[0_0_0_3px_rgba(34,197,94,0.08)]"
        >
          <span className="text-2xl mb-0.5">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-[#666] leading-relaxed">{description}</span>
        </button>
      ))}
    </div>
  </div>
);

const DoctorOverview = () => (
  <div className="flex flex-col gap-8">
    <section className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Today's Appointments Queue</h2>
        <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
          {QUEUE_DATA.filter((r) => r.status === "Pending").length} remaining
        </span>
      </div>
      <DataTable columns={QUEUE_COLUMNS} rows={QUEUE_DATA} onRowAction={(row) => console.log("Open patient:", row)} />
    </section>

    <QuickActionPanel actions={QUICK_ACTIONS} />
  </div>
);

export default function DoctorDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Doctor Dashboard">
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="appointments" element={<Placeholder label="Appointments" />} />
        <Route path="patients" element={<Placeholder label="My Patients" />} />
        <Route path="schedule" element={<Placeholder label="Schedule" />} />
      </Routes>
    </DashboardLayout>
  );
}