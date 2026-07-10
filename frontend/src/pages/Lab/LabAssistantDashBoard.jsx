import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import MetricCard from "../../components/MetricCard";
import DataTable from "../../components/DataTable";
import LabTestRequests from "./LabTestRequests";
import LabResults from "./LabResults"

const NAV_ITEMS = [
  { to: "/lab_assistant-dashboard", label: "Overview" },
  { to: "/lab_assistant-dashboard/requests", label: "Test Requests" },
  { to: "/lab_assistant-dashboard/results", label: "Results" },
  { to: "/lab_assistant-dashboard/reports", label: "Reports" },
];

const STATS = [
  { label: "Pending Tests", value: "14", sub: "Awaiting collection", accent: true },
  { label: "Completed Today", value: "18", sub: "As of 2:30 PM" },
  { label: "Critical Results", value: "2", sub: "Flagged for review" },
  { label: "This Week", value: "96", sub: "Total tests processed" },
];

const REQUEST_COLUMNS = [
  { key: "patient", label: "Patient" },
  { key: "doctor", label: "Requested By" },
  { key: "testType", label: "Test Type" },
  { key: "status", label: "Status", type: "status" },
];

const REQUEST_DATA = [
  { id: 1, patient: "Sanjay Gurung", doctor: "Dr. Ramesh Karki", testType: "Lipid Panel", status: "Pending" },
  { id: 2, patient: "Anita Sharma", doctor: "Dr. Sita Thapa", testType: "Complete Blood Count", status: "In Progress" },
  { id: 3, patient: "Bikram Magar", doctor: "Dr. Bikash Rai", testType: "MRI - Brain", status: "Pending" },
  { id: 4, patient: "Priya Tamang", doctor: "Dr. Ramesh Karki", testType: "Blood Glucose", status: "Completed" },
  { id: 5, patient: "Roshan KC", doctor: "Dr. Puja Shrestha", testType: "Chest X-Ray", status: "Completed" },
];

const QUICK_ACTIONS = [
  { label: "Record Result", description: "Enter results for a completed test" },
  { label: "Flag Critical Value", description: "Escalate an urgent lab result to a doctor" },
  { label: "Log Sample Collection", description: "Mark a sample as collected from a patient" },
];

const Placeholder = ({ label }) => (
  <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
    {label} · Coming Soon
  </div>
);

const QuickActionPanel = ({ actions }) => (
  <div className="flex flex-col gap-4">
    <h2 className="text-base font-semibold text-white tracking-tight">Quick Actions</h2>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
      {actions.map(({ label, description }) => (
        <button
          key={label}
          className="flex flex-col items-start gap-1.5 p-5 bg-[#111111] border border-[#1a1a1a] rounded-xl text-left cursor-pointer transition-all duration-150 hover:border-green-500/40 hover:shadow-[0_0_0_3px_rgba(34,197,94,0.08)]"
        >
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-[#666] leading-relaxed">{description}</span>
        </button>
      ))}
    </div>
  </div>
);

const LabAssistantOverview = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white tracking-tight">Lab at a Glance</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {STATS.map((s) => (
            <MetricCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white tracking-tight">Test Request Queue</h2>
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {REQUEST_DATA.filter((r) => r.status !== "Completed").length} open
          </span>
        </div>
        <DataTable columns={REQUEST_COLUMNS} rows={REQUEST_DATA} onRowAction={setSelectedRequest} />

        {selectedRequest && (
          <div className="bg-[#111111] border-l-4 border-green-500 rounded-r-lg px-6 py-5 flex flex-col gap-1.5 text-sm text-[#ccc]">
            <h3 className="text-sm font-bold text-white mb-1">Test Request Detail</h3>
            <p><span className="font-semibold text-white">Patient:</span> {selectedRequest.patient}</p>
            <p><span className="font-semibold text-white">Requested By:</span> {selectedRequest.doctor}</p>
            <p><span className="font-semibold text-white">Test Type:</span> {selectedRequest.testType}</p>
            <p><span className="font-semibold text-white">Status:</span> {selectedRequest.status}</p>
          </div>
        )}
      </section>

      <QuickActionPanel actions={QUICK_ACTIONS} />
    </div>
  );
};

export default function LabAssistantDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Lab Dashboard">
      <Routes>
        <Route index element={<LabAssistantOverview />} />
        <Route path="requests" element={<LabTestRequests />} />
        <Route path="results" element={<LabResults />} />
        <Route path="reports" element={<Placeholder label="Reports" />} />
      </Routes>
    </DashboardLayout>
  );
}