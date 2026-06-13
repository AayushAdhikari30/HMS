// --- Components/DashboardLayout/DashboardLayout.jsx ---

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./DashboardLayout.module.css";

// --- Sub-component: SidebarNavItem ---
const SidebarNavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
    }
  >
    <span className={styles.navIcon}>{icon}</span>
    <span className={styles.navLabel}>{label}</span>
  </NavLink>
);

// --- Sub-component: TopNavbar ---
const TopNavbar = ({ user, onLogout, pageTitle }) => (
  <header className={styles.topbar}>
    <h1 className={styles.pageTitle}>{pageTitle}</h1>
    <div className={styles.topbarRight}>
      <div className={styles.userBadge}>
        <span className={styles.userAvatar}>
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </span>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userRole}>{user?.role}</span>
        </div>
      </div>
      <button className={styles.logoutBtn} onClick={onLogout}>
        Sign Out
      </button>
    </div>
  </header>
);

// --- Sub-component: Sidebar ---
const Sidebar = ({ navItems, role }) => {
  const roleLabels = {
    patient: "Patient Portal",
    doctor: "Doctor Portal",
    admin: "Admin Console",
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <span className={styles.brandMark}>+</span>
        <span className={styles.brandName}>HMS</span>
      </div>
      <span className={styles.portalLabel}>{roleLabels[role]}</span>
      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
};

// --- Main: DashboardLayout ---
const DashboardLayout = ({ navItems, pageTitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.shell}>
      <Sidebar navItems={navItems} role={user?.role} />
      <div className={styles.mainColumn}>
        <TopNavbar user={user} onLogout={handleLogout} pageTitle={pageTitle} />
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
