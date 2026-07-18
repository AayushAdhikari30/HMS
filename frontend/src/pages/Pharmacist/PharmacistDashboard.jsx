import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import MetricCard from "../../components/MetricCard";
import DataTable from "../../components/DataTable";

const NAV_ITEMS = [
  { to: "/pharmacist-dashboard", label: "Overview" },
  { to: "/pharmacist-dashboard/prescriptions", label: "Prescription Queue" },
  { to: "/pharmacist-dashboard/inventory", label: "Inventory" },
  { to: "/pharmacist-dashboard/reports", label: "Reports" },
];

const STATS = [
  { label: "Pending Prescriptions", value: "9", sub: "Awaiting fulfillment", accent: true },
  { label: "Filled Today", value: "23", sub: "As of 2:30 PM" },
  { label: "Low Stock Items", value: "5", sub: "Reorder recommended" },
  { label: "Total SKUs", value: "412", sub: "Across all categories" },
];

const QUEUE_COLUMNS = [
  { key: "patient", label: "Patient" },
  { key: "doctor", label: "Prescribed By" },
  { key: "medication", label: "Medication" },
  { key: "status", label: "Status", type: "status" },
];

const QUEUE_DATA = [
  { id: 1, patient: "Sanjay Gurung", doctor: "Dr. Ramesh Karki", medication: "Atorvastatin 20mg", status: "Pending" },
  { id: 2, patient: "Anita Sharma", doctor: "Dr. Sita Thapa", medication: "Amoxicillin 500mg", status: "Pending" },
  { id: 3, patient: "Bikram Magar", doctor: "Dr. Bikash Rai", medication: "Metformin 500mg", status: "Completed" },
  { id: 4, patient: "Priya Tamang", doctor: "Dr. Ramesh Karki", medication: "Losartan 50mg", status: "Pending" },
  { id: 5, patient: "Roshan KC", doctor: "Dr. Puja Shrestha", medication: "Cetirizine 10mg", status: "Completed" },
];

const LOW_STOCK_COLUMNS = [
  { key: "name", label: "Medicine" },
  { key: "stock", label: "In Stock" },
  { key: "threshold", label: "Reorder Threshold" },
  { key: "status", label: "Status", type: "status" },
];

const LOW_STOCK_DATA = [
  { id: 1, name: "Amoxicillin 500mg", stock: 42, threshold: 100, status: "Pending" },
  { id: 2, name: "Insulin Glargine", stock: 8, threshold: 30, status: "Pending" },
  { id: 3, name: "Salbutamol Inhaler", stock: 15, threshold: 25, status: "Pending" },
];

const Placeholder = ({ label }) => (
  <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
    {label} · Coming Soon
  </div>
);

const PharmacistOverview = () => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Pharmacy at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {STATS.map((s) => (
            <MetricCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">Prescription Queue</h2>
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {QUEUE_DATA.filter((r) => r.status === "Pending").length} pending
          </span>
        </div>
        <DataTable columns={QUEUE_COLUMNS} rows={QUEUE_DATA} onRowAction={setSelectedItem} />

        {selectedItem && (
          <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-1.5 text-sm text-[#ccc]">
            <h3 className="text-sm font-bold text-white mb-1">Prescription Detail</h3>
            <p><span className="font-semibold text-white">Patient:</span> {selectedItem.patient}</p>
            <p><span className="font-semibold text-white">Prescribed By:</span> {selectedItem.doctor}</p>
            <p><span className="font-semibold text-white">Medication:</span> {selectedItem.medication}</p>
            <p><span className="font-semibold text-white">Status:</span> {selectedItem.status}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Low Stock Alerts</h2>
        <DataTable columns={LOW_STOCK_COLUMNS} rows={LOW_STOCK_DATA} />
      </section>
    </div>
  );
};

export default function PharmacistDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Pharmacist Dashboard">
      <Routes>
        <Route index element={<PharmacistOverview />} />
        <Route path="prescriptions" element={<Placeholder label="Prescription Queue" />} />
        <Route path="inventory" element={<Placeholder label="Inventory" />} />
        <Route path="reports" element={<Placeholder label="Reports" />} />
      </Routes>
    </DashboardLayout>
  );
}