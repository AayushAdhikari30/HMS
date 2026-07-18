import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const ReportCard = ({ test }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-3">
    <div className="flex items-start justify-between flex-wrap gap-2">
      <div>
        <h3 className="text-sm font-semibold text-white">{test.testName}</h3>
        <p className="text-xs text-[#666] mt-0.5">
          {test.labAssistant?.identifier ? `Processed by ${test.labAssistant.identifier}` : "Lab Report"}
        </p>
      </div>
      <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full whitespace-nowrap">
        Completed · {formatDate(test.completedAt)}
      </span>
    </div>

    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-1.5">Result</p>
      <p className="text-sm text-[#ddd] whitespace-pre-wrap">{test.result}</p>
    </div>

    {test.notes && (
      <p className="text-sm text-[#999]">
        <span className="text-[#666] font-semibold">Notes: </span>
        {test.notes}
      </p>
    )}
  </div>
);

const PatientReports = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/labs", { params: { status: "completed" } });
      if (res.data?.success) setTests(res.data.labTests);
    } catch (err) {
      console.warn("[PatientReports] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Your Reports</h2>
        {tests.length > 0 && (
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {tests.length} total
          </span>
        )}
      </div>

      {loading && (
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl py-16 px-8 text-center text-sm text-[#666]">
          Loading reports…
        </div>
      )}

      {!loading && tests.length === 0 && (
        <div className="bg-[#111111] border border-dashed border-[#2a2a2a] rounded-xl py-16 px-8 text-center text-sm text-[#555]">
          No reports yet. Once a lab test you requested is completed, it will show up here.
        </div>
      )}

      {!loading && tests.map((t) => <ReportCard key={t.id} test={t} />)}
    </div>
  );
};

export default PatientReports;
