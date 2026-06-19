

const MetricCard = ({ label, value, sub, accent = false }) => (
  <div
    className={`bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-1.5 transition-colors duration-150 hover:border-[#2a2a2a] ${
      accent ? "border-l-4 border-l-green-500" : ""
    }`}
  >
    <span className="text-xs font-semibold uppercase tracking-widest text-[#666]">{label}</span>
    <span className="text-3xl font-bold text-white leading-tight tracking-tight">{value}</span>
    {sub && <span className="text-sm text-green-500 font-medium">{sub}</span>}
  </div>
);

export default MetricCard;