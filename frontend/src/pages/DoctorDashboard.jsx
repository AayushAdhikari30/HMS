import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DataTable from "../components/DataTable";
import DoctorAppointments from "./DoctorAppointments";
import DoctorPatients from "./DoctorPatients";
import DoctorSchedule from "./DoctorSchedule";
import api from "../api/axios";

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

const QUICK_ACTIONS = [
  {
    label: "Write Prescription",
    icon: "",
    description: "Create a new prescription for a patient",
    to: "/doctor-dashboard/patients",
  },
  { label: "View Schedule", icon: "", description: "Check your full weekly calendar", to: "/doctor-dashboard/schedule" },
  { label: "Request Lab Test", icon: "", description: "Order diagnostic tests for a patient" },
  { label: "Refer Patient", icon: "↗", description: "Send a referral to another department" },
];

const formatTime = (t) => {
  if (!t) return "—";
  const [hStr, m] = t.slice(0, 5).split(":");
  const hour = Number(hStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${period}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const QuickActionPanel = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-white tracking-tight">Quick Actions</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {actions.map(({ label, icon, description, to }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            disabled={!to}
            className="flex flex-col items-start gap-1.5 p-5 bg-[#111111] border border-[#1a1a1a] rounded-xl text-left cursor-pointer transition-all duration-150 hover:border-green-500/40 hover:shadow-[0_0_0_3px_rgba(34,197,94,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-2xl mb-0.5">{icon}</span>
            <span className="text-sm font-semibold text-white">{label}</span>
            <span className="text-xs text-[#666] leading-relaxed">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const DoctorOverview = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaysQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments", { params: { date: todayIso() } });
      if (res.data?.success) {
        const rows = res.data.appointments
          .map((appt) => ({
            id: appt.id,
            patient: appt.patient?.name ?? "—",
            time: formatTime(appt.startTime),
            type: appt.reason || "Visit",
            status: appt.status,
          }))
          .sort((a, b) => (a.time > b.time ? 1 : -1));
        setQueue(rows);
      }
    } catch (err) {
      console.warn("[DoctorOverview] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysQueue();
  }, [fetchTodaysQueue]);

  const remaining = queue.filter((r) => r.status === "pending" || r.status === "confirmed").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white tracking-tight">Today's Appointments Queue</h2>
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {remaining} remaining
          </span>
        </div>
        {loading ? (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-10 px-8 text-center text-sm text-[#666]">
            Loading today's queue…
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-10 px-8 text-center text-sm text-[#555]">
            No appointments scheduled for today.
          </div>
        ) : (
          <DataTable columns={QUEUE_COLUMNS} rows={queue} onRowAction={(row) => console.log("Open patient:", row)} />
        )}
      </section>

      <QuickActionPanel actions={QUICK_ACTIONS} />
    </div>
  );
};

export default function DoctorDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Doctor Dashboard">
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="schedule" element={<DoctorSchedule />} />
      </Routes>
    </DashboardLayout>
  );
}
