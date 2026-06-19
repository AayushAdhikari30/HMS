// --- Pages/doctor/DoctorDashboard.jsx ---

import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import DataTable from "../components/DataTable/DataTable";
import styles from "./DoctorDashboard.module.css";

const NAV_ITEMS = [
  { to: "/doctor", icon: "⊞", label: "Overview" },
  { to: "/doctor/appointments", icon: "📅", label: "Appointments" },
  { to: "/doctor/patients", icon: "👤", label: "My Patients" },
  { to: "/doctor/schedule", icon: "🗓", label: "Schedule" },
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
  { label: "Write Prescription", icon: "✍️", description: "Create a new prescription for a patient" },
  { label: "View Schedule", icon: "🗓", description: "Check your full weekly calendar" },
  { label: "Request Lab Test", icon: "🔬", description: "Order diagnostic tests for a patient" },
  { label: "Refer Patient", icon: "↗️", description: "Send a referral to another department" },
];

// --- Sub-component: QuickActionPanel ---
const QuickActionPanel = ({ actions }) => (
  <div className={styles.quickPanel}>
    <h2 className={styles.sectionTitle}>Quick Actions</h2>
    <div className={styles.actionGrid}>
      {actions.map(({ label, icon, description }) => (
        <button key={label} className={styles.actionCard}>
          <span className={styles.actionIcon}>{icon}</span>
          <span className={styles.actionLabel}>{label}</span>
          <span className={styles.actionDesc}>{description}</span>
        </button>
      ))}
    </div>
  </div>
);

// --- Sub-view: DoctorOverview ---
const DoctorOverview = () => (
  <div className={styles.overviewGrid}>
    <section className={styles.queueSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Today's Appointments Queue</h2>
        <span className={styles.queueCount}>
          {QUEUE_DATA.filter((r) => r.status === "Pending").length} remaining
        </span>
      </div>
      <DataTable
        columns={QUEUE_COLUMNS}
        rows={QUEUE_DATA}
        onRowAction={(row) => console.log("Open patient:", row)}
      />
    </section>

    <QuickActionPanel actions={QUICK_ACTIONS} />
  </div>
);

// --- DoctorDashboard Router ---
export default function DoctorDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Doctor Dashboard">
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="appointments" element={<div className={styles.placeholder}>Appointments · Coming Soon</div>} />
        <Route path="patients" element={<div className={styles.placeholder}>My Patients · Coming Soon</div>} />
        <Route path="schedule" element={<div className={styles.placeholder}>Schedule · Coming Soon</div>} />
      </Routes>
    </DashboardLayout>
  );
}
