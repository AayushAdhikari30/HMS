import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import MetricCard from "../../components/MetricCard";
import DataTable from "../../components/DataTable";
import PrescriptionQueue from "./PrescriptionQueue";
import PharmacistInventory from "./Pharmacistinventory";
import PharmacyReports from "./PharmacyReports";

const NAV_ITEMS = [
  { to: "/pharmacist-dashboard", label: "Overview" },
  { to: "/pharmacist-dashboard/prescriptions", label: "Prescription Queue" },
  { to: "/pharmacist-dashboard/inventory", label: "Inventory" },
  { to: "/pharmacist-dashboard/reports", label: "Reports" },
];

const QUEUE_COLUMNS = [
  { key: "patient", label: "Patient" },
  { key: "doctor", label: "Prescribed By" },
  { key: "medication", label: "Medication" },
  { key: "status", label: "Status", type: "status" },
];

const LOW_STOCK_COLUMNS = [
  { key: "name", label: "Medicine" },
  { key: "stock", label: "In Stock" },
  { key: "threshold", label: "Reorder Threshold" },
  { key: "status", label: "Status", type: "status" },
];

const PharmacistOverview = () => {
  const [stats, setStats] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await api.get("/pharmacy/reports/stats");
        if (statsRes.data?.success) {
          setStats(statsRes.data.stats);
        }

        // Fetch pending prescriptions
        const rxRes = await api.get("/pharmacy/prescriptions");
        if (rxRes.data?.success) {
          setPrescriptions(rxRes.data.prescriptions.slice(0, 5)); // Top 5
        }

        // Fetch low stock medicines
        const medRes = await api.get("/medicines?lowStock=true");
        if (medRes.data?.success) {
          setMedicines(
            medRes.data.medicines
              .slice(0, 3)
              .map((m) => ({
                id: m.id,
                name: m.name,
                stock: m.stock,
                threshold: m.reorderThreshold,
                status: "Pending",
              })),
          );
        }
      } catch (err) {
        console.warn("[PharmacistOverview] fetch failed:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const STATS = [
    {
      label: "Pending Prescriptions",
      value: stats?.pendingPrescriptions || "0",
      sub: "Awaiting fulfillment",
      accent: true,
    },
    {
      label: "Filled Today",
      value: stats?.filledToday || "0",
      sub: "As of now",
    },
    {
      label: "Low Stock Items",
      value: stats?.lowStockItems || "0",
      sub: "Reorder recommended",
    },
    {
      label: "Monthly Revenue",
      value: `$${(stats?.monthlyRevenue || 0).toFixed(0)}`,
      sub: `${stats?.totalTransactions || 0} transactions`,
    },
  ];

  const QUEUE_DATA = prescriptions.map((rx) => ({
    id: rx.id,
    patient: rx.patient?.name || "Unknown",
    doctor: rx.doctor?.name || "Unknown",
    medication: rx.medications?.[0]?.name || "—",
    status: rx.fulfillmentStatus === "pending" ? "Pending" : "Partial",
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">
          Pharmacy at a Glance
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {STATS.map((s) => (
            <MetricCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Recent Prescriptions
          </h2>
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {QUEUE_DATA.filter((r) => r.status === "Pending").length} pending
          </span>
        </div>
        {loading ? (
          <div className="text-center text-[#666] py-8">Loading...</div>
        ) : (
          <>
            {QUEUE_DATA.length > 0 ? (
              <>
                <DataTable
                  columns={QUEUE_COLUMNS}
                  rows={QUEUE_DATA}
                  onRowAction={setSelectedItem}
                />

                {selectedItem && (
                  <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-1.5 text-sm text-[#ccc]">
                    <h3 className="text-sm font-bold text-white mb-1">
                      Prescription Detail
                    </h3>
                    <p>
                      <span className="font-semibold text-white">Patient:</span>{" "}
                      {selectedItem.patient}
                    </p>
                    <p>
                      <span className="font-semibold text-white">
                        Prescribed By:
                      </span>{" "}
                      {selectedItem.doctor}
                    </p>
                    <p>
                      <span className="font-semibold text-white">
                        Medication:
                      </span>{" "}
                      {selectedItem.medication}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Status:</span>{" "}
                      {selectedItem.status}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-12 px-8 text-center text-sm text-[#555]">
                No pending prescriptions
              </div>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">
          Low Stock Alerts
        </h2>
        {loading ? (
          <div className="text-center text-[#666] py-8">Loading...</div>
        ) : medicines.length > 0 ? (
          <DataTable columns={LOW_STOCK_COLUMNS} rows={medicines} />
        ) : (
          <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-12 px-8 text-center text-sm text-[#555]">
            All items in stock
          </div>
        )}
      </section>
    </div>
  );
};

export default function PharmacistDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Pharmacist Dashboard">
      <Routes>
        <Route index element={<PharmacistOverview />} />
        <Route path="prescriptions" element={<PrescriptionQueue />} />
        <Route path="inventory" element={<PharmacistInventory />} />
        <Route path="reports" element={<PharmacyReports />} />
      </Routes>
    </DashboardLayout>
  );
}