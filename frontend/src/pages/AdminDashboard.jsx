import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";

const NAV_ITEMS = [
  { to: "/admin-dashboard", icon: "", label: "Overview" },
  { to: "/admin-dashboard/users", icon: "", label: "User Management" },
  { to: "/admin-dashboard/rooms", icon: "", label: "Room Management" },
  { to: "/admin-dashboard/billing", icon: "", label: "Billing" },
  { to: "/admin-dashboard/reports", icon: "", label: "Reports" },
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

const ROLE_PILL_STYLES = {
  doctor: "bg-blue-500/10 text-blue-400",
  patient: "bg-green-500/10 text-green-500",
  admin: "bg-purple-500/10 text-purple-400",
};

const Placeholder = ({ label }) => (
  <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
    {label} · Coming Soon
  </div>
);

// --- Sub-component: UserRow ---
const UserRow = ({ user, onToggle, onDelete }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-mono text-xs text-[#666]">{user.id}</span>
    </td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{user.name}</span>
    </td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide capitalize ${ROLE_PILL_STYLES[user.role]}`}>
        {user.role}
      </span>
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{user.department}</td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <span
          className={`w-1.5 h-1.5 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-amber-400"}`}
        />
        <span className={user.status === "Active" ? "text-green-500" : "text-amber-400"}>{user.status}</span>
      </span>
    </td>
    <td className="px-5 py-3.5 align-middle">
      <div className="flex gap-2">
        <button
          onClick={() => onToggle(user)}
          className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          Toggle Status
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Remove
        </button>
      </div>
    </td>
  </tr>
);

// --- Sub-component: UserManagementConsole ---
const UserManagementConsole = ({ users, onToggle, onDelete, activeFilter, onFilterChange }) => {
  const filtered = activeFilter === "All" ? users : users.filter((u) => u.role === activeFilter);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">User Management Console</h2>
        <div className="flex gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150 cursor-pointer ${
                activeFilter === f
                  ? "bg-green-500 border-green-500 text-black"
                  : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
              }`}
            >
              {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["ID", "Name", "Role", "Department", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/[0.02] border-b border-[#1a1a1a]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <UserRow key={user.id} user={user} onToggle={onToggle} onDelete={onDelete} />
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
      prev.map((u) => (u.id === target.id ? { ...u, status: u.status === "Active" ? "On Leave" : "Active" } : u))
    );

  const handleDelete = (id) => setUsers((prev) => prev.filter((u) => u.id !== id));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Hospital Statistics</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
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
        <Route path="users" element={<Placeholder label="User Management" />} />
        <Route path="rooms" element={<Placeholder label="Room Management" />} />
        <Route path="billing" element={<Placeholder label="Billing" />} />
        <Route path="reports" element={<Placeholder label="Reports" />} />
      </Routes>
    </DashboardLayout>
  );
}