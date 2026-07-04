import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import AddStaffForm from "../components/AddStaffForm";
import api from "../api/axios";

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
  { id: "u1", identifier: "DOC-2026-0001", name: "DOC-2026-0001", role: "doctor", department: "—", status: "Active", is_active: true },
  { id: "u2", identifier: "sanjay.gurung@example.com", name: "Sanjay Gurung", role: "patient", department: "—", status: "Active", is_active: true },
  { id: "u3", identifier: "DOC-2026-0002", name: "DOC-2026-0002", role: "doctor", department: "—", status: "On Leave", is_active: false },
  { id: "u4", identifier: "anita.sharma@example.com", name: "Anita Sharma", role: "patient", department: "—", status: "Active", is_active: true },
  { id: "u5", identifier: "ADM-2026-0001", name: "ADM-2026-0001", role: "admin", department: "—", status: "Active", is_active: true },
];

const ROLE_FILTERS = ["All", "doctor", "patient", "admin", "pharmacist", "lab_assistant"];

const ROLE_PILL_STYLES = {
  doctor: "bg-blue-500/10 text-blue-400",
  patient: "bg-green-500/10 text-green-500",
  admin: "bg-purple-500/10 text-purple-400",
  pharmacist: "bg-amber-500/10 text-amber-400",
  lab_assistant: "bg-cyan-500/10 text-cyan-400",
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
      <span className="font-mono text-xs text-[#666]">{user.identifier}</span>
    </td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="font-medium text-[#ddd]">{user.name}</span>
    </td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide capitalize ${ROLE_PILL_STYLES[user.role] ?? "bg-white/5 text-[#888]"}`}>
        {user.role}
      </span>
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{user.department}</td>
    <td className="px-5 py-3.5 text-sm align-middle">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-500" : "bg-amber-400"}`} />
        <span className={user.is_active ? "text-green-500" : "text-amber-400"}>{user.status}</span>
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

const UserManagementConsole = ({ users, onToggle, onDelete, activeFilter, onFilterChange, loading }) => {
  const filtered = activeFilter === "All" ? users : users.filter((u) => u.role === activeFilter);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">User Management Console</h2>
        <div className="flex gap-2 flex-wrap">
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
              {f === "All" ? "All" : f.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase()) + "s"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Identifier", "Name", "Role", "Department", "Status", "Actions"].map((h) => (
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
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  No users match this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((user) => (
                <UserRow key={user.id} user={user} onToggle={onToggle} onDelete={onDelete} />
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const AdminOverview = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/users");
        if (!cancelled && res.data?.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.warn("[AdminOverview] Falling back to mock data:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (target) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? { ...u, is_active: !u.is_active, status: !u.is_active ? "Active" : "On Leave" }
          : u,
      ),
    );
    try {
      await api.patch(`/users/${target.id}/toggle-status`);
    } catch (err) {
      console.error("[AdminOverview] toggle-status failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await api.delete(`/users/${id}`);
    } catch (err) {
      console.error("[AdminOverview] delete failed:", err.message);
    }
  };

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
        loading={loading}
      />
    </div>
  );
};


const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      if (res.data?.success) setUsers(res.data.users);
    } catch (err) {
      console.warn("[UserManagementPage] fetch failed:", err.message);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (target) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? { ...u, is_active: !u.is_active, status: !u.is_active ? "Active" : "On Leave" }
          : u,
      ),
    );
    try {
      await api.patch(`/users/${target.id}/toggle-status`);
    } catch (err) {
      console.error("[UserManagementPage] toggle-status failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await api.delete(`/users/${id}`);
    } catch (err) {
      console.error("[UserManagementPage] delete failed:", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <AddStaffForm onCreated={fetchUsers} />

      <UserManagementConsole
        users={users}
        onToggle={handleToggle}
        onDelete={handleDelete}
        activeFilter={filter}
        onFilterChange={setFilter}
        loading={loading}
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
        <Route path="users" element={<UserManagementPage />} />
        <Route path="rooms" element={<Placeholder label="Room Management" />} />
        <Route path="billing" element={<Placeholder label="Billing" />} />
        <Route path="reports" element={<Placeholder label="Reports" />} />
      </Routes>
    </DashboardLayout>
  );
}
