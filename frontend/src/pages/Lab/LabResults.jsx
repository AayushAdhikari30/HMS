import { useState, useMemo } from "react";

const inputClass = `
  w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2.5
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

// Mock data : replace with GET /lab-tests?status=completed once the backend model exists
const INITIAL_RESULTS = [
  {
    id: "lt2",
    patient: "Anita Sharma",
    doctor: "Dr. Sita Thapa",
    testType: "Complete Blood Count",
    requestedAt: "2026-07-08",
    completedAt: "2026-07-09",
    result: "WBC 7.2 x10^9/L, RBC 4.8 x10^12/L, Hemoglobin 13.9 g/dL, Platelets 245 x10^9/L — all within normal range.",
    critical: false,
  },
  {
    id: "lt4",
    patient: "Priya Tamang",
    doctor: "Dr. Ramesh Karki",
    testType: "Blood Glucose",
    requestedAt: "2026-07-06",
    completedAt: "2026-07-06",
    result: "Fasting glucose 168 mg/dL — elevated, above reference range (70–99 mg/dL).",
    critical: true,
  },
  {
    id: "lt5",
    patient: "Roshan KC",
    doctor: "Dr. Puja Shrestha",
    testType: "Chest X-Ray",
    requestedAt: "2026-07-05",
    completedAt: "2026-07-05",
    result: "No acute cardiopulmonary abnormality. Lungs clear bilaterally.",
    critical: false,
  },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const CriticalPill = ({ critical }) =>
  critical ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-red-500/10 text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Critical
    </span>
  ) : (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-green-500/10 text-green-500">
      Normal
    </span>
  );

const ResultDetailRow = ({ result }) => (
  <tr className="bg-white/2 border-b border-[#1a1a1a]">
    <td colSpan={6} className="px-5 py-4">
      <div className="flex flex-col gap-1.5 max-w-3xl">
        <span className="text-[#888] text-xs font-semibold uppercase tracking-widest">Findings</span>
        <p className="text-sm text-[#ccc] leading-relaxed">{result.result}</p>
      </div>
    </td>
  </tr>
);

const ResultRow = ({ result, expanded, onToggle }) => (
  <>
    <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/2 transition-colors duration-100">
      <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{result.patient}</td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{result.doctor}</td>
      <td className="px-5 py-3.5 text-sm text-[#ccc] align-middle">{result.testType}</td>
      <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDate(result.completedAt)}</td>
      <td className="px-5 py-3.5 text-sm align-middle">
        <CriticalPill critical={result.critical} />
      </td>
      <td className="px-5 py-3.5 align-middle">
        <button
          onClick={onToggle}
          className="border border-[#2a2a2a] text-[#ccc] rounded-md px-2.5 py-1 text-xs font-semibold hover:border-green-500/40 hover:text-green-500 transition-colors duration-150 cursor-pointer"
        >
          {expanded ? "Close" : "View Result"}
        </button>
      </td>
    </tr>
    {expanded && <ResultDetailRow result={result} />}
  </>
);

const LabResults = () => {
  const [results] = useState(INITIAL_RESULTS);
  const [search, setSearch] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const matchesSearch =
        !search.trim() ||
        r.patient.toLowerCase().includes(search.trim().toLowerCase()) ||
        r.testType.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCritical = !criticalOnly || r.critical;
      return matchesSearch && matchesCritical;
    });
  }, [results, search, criticalOnly]);

  const criticalCount = results.filter((r) => r.critical).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Completed Results</h2>
        {criticalCount > 0 && (
          <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
            {criticalCount} critical value{criticalCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient or test type…"
          className={`${inputClass} max-w-xs`}
        />
        <label className="flex items-center gap-2 text-sm text-[#ccc] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
            className="accent-red-500"
          />
          Critical only
        </label>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Patient", "Requested By", "Test Type", "Completed", "Flag", "Action"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/2 border-b border-[#1a1a1a]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  No completed results match this view.
                </td>
              </tr>
            )}
            {filtered.map((result) => (
              <ResultRow
                key={result.id}
                result={result}
                expanded={expandedId === result.id}
                onToggle={() => setExpandedId(expandedId === result.id ? null : result.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabResults;