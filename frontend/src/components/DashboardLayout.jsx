import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "Admin Console",
  pharmacist: "Pharmacist Portal",
  lab_assistant: "Lab Portal",
};

const HospitalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SidebarNavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-green-500 text-black"
          : "text-[#888] hover:text-white hover:bg-white/5"
      }`
    }
  >
    <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
  </NavLink>
);

const TopNavbar = ({ user, onLogout, pageTitle }) => (
  <header className="flex items-center justify-between px-8 h-16 bg-[#0d0d0d] border-b border-[#1a1a1a] sticky top-0 z-10">
    <h1 className="text-base font-semibold text-white tracking-tight">{pageTitle}</h1>
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">{user?.name}</span>
          <span className="text-xs text-[#666] capitalize">{user?.role}</span>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="border border-[#2a2a2a] text-[#888] text-xs font-medium rounded-lg px-3.5 py-1.5 hover:border-[#444] hover:text-white transition-colors duration-150 cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  </header>
);

const Sidebar = ({ navItems, role }) => (
  <aside className="w-60 flex-shrink-0 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col py-6 sticky top-0 h-screen overflow-y-auto">
    <div className="flex items-center gap-2 px-6 pb-1">
      <HospitalIcon />
      <span className="text-lg font-bold text-white tracking-tight">
        Medi<span className="text-green-500">Care</span>
      </span>
    </div>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#555] px-6 mb-7 mt-1">
      {ROLE_LABELS[role]}
    </span>
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => (
        <SidebarNavItem key={item.to} {...item} />
      ))}
    </nav>
  </aside>
);

const DashboardLayout = ({ navItems, pageTitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar navItems={navItems} role={user?.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar user={user} onLogout={handleLogout} pageTitle={pageTitle} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;