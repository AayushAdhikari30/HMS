const STATUS_STYLES = {
  completed: "bg-green-500/10 text-green-500",
  pending: "bg-amber-500/10 text-amber-400",
  cancelled: "bg-red-500/10 text-red-400",
  "in progress": "bg-blue-500/10 text-blue-400",
};

const StatusPill = ({ status }) => {
  const normalized = status?.toLowerCase();
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
        STATUS_STYLES[normalized] ?? "bg-white/5 text-[#888]"
      }`}
    >
      {status}
    </span>
  );
};

const DataTable = ({ columns, rows, onRowAction }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map(({ key, label }) => (
            <th
              key={key}
              className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/[0.02] border-b border-[#1a1a1a]"
            >
              {label}
            </th>
          ))}
          {onRowAction && (
            <th className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/[0.02] border-b border-[#1a1a1a]">
              Action
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id ?? idx} className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] transition-colors duration-100">
            {columns.map(({ key, type }) => (
              <td key={key} className="px-5 py-3.5 text-sm text-[#ccc] align-middle">
                {type === "status" ? <StatusPill status={row[key]} /> : row[key]}
              </td>
            ))}
            {onRowAction && (
              <td className="px-5 py-3.5 align-middle">
                <button
                  onClick={() => onRowAction(row)}
                  className="border border-green-500/40 text-green-500 rounded-md px-3 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer"
                >
                  View
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;