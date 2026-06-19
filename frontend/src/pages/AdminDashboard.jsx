
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import MetricCard from "../components/MetricCard/MetricCard";
import styles from "./AdminDashboard.module.css";

const NAV_ITEMS = [
  { to: "/admin", icon: "⊞", label: "Overview" },
  { to: "/admin/users", icon: "👥", label: "User Management" },
  { to: "/admin/rooms", icon: "🏥", label: "Room Management" },
  { to: "/admin/billing", icon: "💳", label: "Billing" },
  { to: "/admin/reports", icon: "📊", label: "Reports" },
];

const STATS = [
  { label: "Total Patients", value: "1,248", sub: "+12 this week", accent: true },
  { label: "Active Doctors", value: "34", sub: "6 on leave" },
  { label: "Rooms Available", value: "18", sub: "of 52 total" },
  { label: "Pending Admissions", value: "7", sub: "Awaiting assignment" },
];

const MOCK_USERS = [
  { id: "U001", name: "Dr. Ramesh Karki", role: "doctor", department: "Cardiology", status: "Active" },
  { id: "U002", name: "Sanjay Gurung", role: "patient", department: "—", status: "Active" },
  { id: "U003", name: "Dr. Sita Thapa", role: "doctor", department: "Neurology", status: "On Leave" },
  { id: "U004", name: "Anita Sharma", role: "patient", department: "—", status: "Active" },
  { id: "U005", name: "Dr. Bikash Rai", role: "doctor", department: "Orthopedics", status: "Active" },
];

const ROLE_FILTERS = ["All", "doctor", "patient", "admin"];

// --- Sub-component: UserRow ---
const UserRow = ({ user, onToggle, onDelete }) => (
  <tr className={styles.tableRow}>
    <td className={styles.td}>
      <span className={styles.userId}>{user.id}</span>
    </td>
    <td className={styles.td}>
      <span className={styles.userName}>{user.name}</span>
    </td>
    <td className={styles.td}>
      <span className={`${styles.rolePill} ${styles[`role__${user.role}`]}`}>
        {user.role}
      </span>
    </td>
    <td className={styles.td}>{user.department}</td>
    <td className={styles.td}>
      <span
        className={`${styles.statusDot} ${
          user.status === "Active" ? styles.statusActive : styles.statusInactive
        }`}
      >
        {user.status}
      </span>
    </td>
    <td className={styles.td}>
      <div className={styles.rowActions}>
        <button className={styles.actionBtnEdit} onClick={() => onToggle(user)}>
          Toggle Status
        </button>
        <button className={styles.actionBtnDelete} onClick={() => onDelete(user.id)}>
          Remove
        </button>
      </div>
    </td>
  </tr>
);

// --- Sub-component: UserManagementConsole ---
const UserManagementConsole = ({ users, onToggle, onDelete, activeFilter, onFilterChange }) => {
  const filtered =
    activeFilter === "All"
      ? users
      : users.filter((u) => u.role === activeFilter);

  return (
    <section className={styles.consoleSection}>
      <div className={styles.consoleHeader}>
        <h2 className={styles.sectionTitle}>User Management Console</h2>
        <div className={styles.filterGroup}>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${
                activeFilter === f ? styles.filterBtnActive : ""
              }`}
              onClick={() => onFilterChange(f)}
            >
              {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["ID", "Name", "Role", "Department", "Status", "Actions"].map((h) => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// --- Sub-view: AdminOverview ---
const AdminOverview = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [filter, setFilter] = useState("All");

  const handleToggle = (target) =>
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? { ...u, status: u.status === "Active" ? "On Leave" : "Active" }
          : u
      )
    );

  const handleDelete = (id) =>
    setUsers((prev) => prev.filter((u) => u.id !== id));

  return (
    <div className={styles.overviewGrid}>
      <section className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Hospital Statistics</h2>
        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <MetricCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <UserManagementConsole
        users={users}
        onToggle={handleToggle}
        onDelete={handleDelete}
        activeFilter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
};

// --- AdminDashboard Router ---
export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Admin Console">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<div className={styles.placeholder}>User Management · Coming Soon</div>} />
        <Route path="rooms" element={<div className={styles.placeholder}>Room Management · Coming Soon</div>} />
        <Route path="billing" element={<div className={styles.placeholder}>Billing · Coming Soon</div>} />
        <Route path="reports" element={<div className={styles.placeholder}>Reports · Coming Soon</div>} />
      </Routes>
    </DashboardLayout>
  );
}
