// --- Components/DataTable/DataTable.jsx ---

import styles from "./DataTable.module.css";

const StatusPill = ({ status }) => {
  const normalized = status?.toLowerCase();
  return (
    <span className={`${styles.pill} ${styles[`pill__${normalized}`] ?? ""}`}>
      {status}
    </span>
  );
};

const DataTable = ({ columns, rows, onRowAction }) => (
  <div className={styles.tableWrapper}>
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map(({ key, label }) => (
            <th key={key} className={styles.th}>
              {label}
            </th>
          ))}
          {onRowAction && <th className={styles.th}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id ?? idx} className={styles.tr}>
            {columns.map(({ key, type }) => (
              <td key={key} className={styles.td}>
                {type === "status" ? (
                  <StatusPill status={row[key]} />
                ) : (
                  row[key]
                )}
              </td>
            ))}
            {onRowAction && (
              <td className={styles.td}>
                <button
                  className={styles.rowActionBtn}
                  onClick={() => onRowAction(row)}
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
