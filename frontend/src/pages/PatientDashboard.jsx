// --- Pages/patient/PatientDashboard.jsx ---

import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import MetricCard from "../components/MetricCard/MetricCard";
import DataTable from "../components/DataTable/DataTable";
import styles from "./PatientDashboard.module.css";

const NAV_ITEMS = [
  { to: "/patient", icon: "⊞", label: "Overview" },
  { to: "/patient/appointments", icon: "📅", label: "Appointments" },
  { to: "/patient/prescriptions", icon: "💊", label: "Prescriptions" },
  { to: "/patient/reports", icon: "📋", label: "Reports" },
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

// --- Sub-view: PatientOverview ---
const PatientOverview = () => {
  const [selectedCheckup, setSelectedCheckup] = useState(null);

  return (
    <div className={styles.overviewGrid}>
      <section className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Your Health at a Glance</h2>
        <div className={styles.metricGrid}>
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      </section>

      <section className={styles.checkupsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Checkups</h2>
          {selectedCheckup && (
            <button
              className={styles.clearBtn}
              onClick={() => setSelectedCheckup(null)}
            >
              Clear selection
            </button>
          )}
        </div>

        <DataTable
          columns={CHECKUP_COLUMNS}
          rows={CHECKUP_DATA}
          onRowAction={setSelectedCheckup}
        />

        {selectedCheckup && (
          <div className={styles.checkupDetail}>
            <h3 className={styles.detailTitle}>Checkup Detail</h3>
            <p>
              <strong>Date:</strong> {selectedCheckup.date}
            </p>
            <p>
              <strong>Doctor:</strong> {selectedCheckup.doctor}
            </p>
            <p>
              <strong>Department:</strong> {selectedCheckup.department}
            </p>
            <p>
              <strong>Status:</strong> {selectedCheckup.status}
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
        <Route path="appointments" element={<div className={styles.placeholder}>Appointments · Coming Soon</div>} />
        <Route path="prescriptions" element={<div className={styles.placeholder}>Prescriptions · Coming Soon</div>} />
        <Route path="reports" element={<div className={styles.placeholder}>Reports · Coming Soon</div>} />
      </Routes>
    </DashboardLayout>
  );
}
