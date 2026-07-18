import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

const formatMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

const RevenueReport = ({ data, loading }) => {
  if (loading) {
    return <div className="text-center text-[#666] py-8">Loading revenue data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Revenue Summary</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.03] rounded-lg p-4">
            <p className="text-xs text-[#666] uppercase font-semibold mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-400">
              {formatMoney(data?.totalRevenue)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-4">
            <p className="text-xs text-[#666] uppercase font-semibold mb-1">
              Transactions
            </p>
            <p className="text-2xl font-bold text-blue-400">
              {data?.transactionCount || 0}
            </p>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-white mb-3">Recent Transactions</h4>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[#666] text-xs font-semibold">
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions?.length > 0 ? (
                data.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#1a1a1a] text-[#ccc]">
                    <td className="px-4 py-2">{tx.patient}</td>
                    <td className="px-4 py-2 text-right text-green-400">
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-4 py-2 text-right text-[#666]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-[#666]">
                    No transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InventoryReport = ({ data, loading }) => {
  if (loading) {
    return <div className="text-center text-[#666] py-8">Loading inventory data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#666] uppercase font-semibold mb-1">Total SKUs</p>
          <p className="text-2xl font-bold text-white">{data?.totalSkus || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#666] uppercase font-semibold mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-400">{data?.inStockCount || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#666] uppercase font-semibold mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-amber-400">{data?.lowStockCount || 0}</p>
        </div>
      </div>

      {data?.lowStockItems?.length > 0 && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Low Stock Items</h3>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-[#666] text-xs font-semibold">
                  <th className="px-4 py-2 text-left">Medicine</th>
                  <th className="px-4 py-2 text-center">Current</th>
                  <th className="px-4 py-2 text-center">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#1a1a1a] text-[#ccc]">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-center text-red-400">{item.stock}</td>
                    <td className="px-4 py-2 text-center text-[#666]">
                      {item.threshold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const TopMedicinesReport = ({ data, loading }) => {
  if (loading) {
    return <div className="text-center text-[#666] py-8">Loading medicines data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Top 10 Medicines</h3>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[#666] text-xs font-semibold">
                <th className="px-4 py-2 text-left">Medicine</th>
                <th className="px-4 py-2 text-right">Qty Dispensed</th>
                <th className="px-4 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data?.topMedicines?.length > 0 ? (
                data.topMedicines.map((medicine, idx) => (
                  <tr key={idx} className="border-b border-[#1a1a1a] text-[#ccc]">
                    <td className="px-4 py-2 font-medium">{medicine.name}</td>
                    <td className="px-4 py-2 text-right text-blue-400">
                      {medicine.quantityDispensed}
                    </td>
                    <td className="px-4 py-2 text-right text-green-400">
                      {formatMoney(medicine.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-[#666]">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function PharmacyReports() {
  const [reportType, setReportType] = useState("revenue");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default date range (last 30 days) - runs only once on mount
  useEffect(() => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartDate(start);
    setEndDate(end);
  }, []); 

  // Memoize fetchReport with proper dependencies
  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const res = await api.get("/pharmacy/reports", {
        params: {
          reportType,
          startDate,
          endDate,
        },
      });

      if (res.data?.success) {
        setData(res.data.report);
      }
    } catch (err) {
      console.warn("[PharmacyReports] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate]); // Add dependencies here

  useEffect(() => {
    if (startDate && endDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchReport();
    }
  }, [fetchReport]); 

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight mb-4">
          Pharmacy Reports
        </h2>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={`${inputClass} max-w-xs`}
            >
              <option value="revenue">Revenue</option>
              <option value="inventory">Inventory</option>
              <option value="topMedicines">Top Medicines</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-2">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider block mb-2">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-green-500 text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>
      </div>

      {data && (
        <>
          {reportType === "revenue" && (
            <RevenueReport data={data} loading={loading} />
          )}
          {reportType === "inventory" && (
            <InventoryReport data={data} loading={loading} />
          )}
          {reportType === "topMedicines" && (
            <TopMedicinesReport data={data} loading={loading} />
          )}
        </>
      )}
    </div>
  );
}