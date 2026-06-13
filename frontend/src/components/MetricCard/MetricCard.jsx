// --- Components/MetricCard/MetricCard.jsx ---

import styles from "./MetricCard.module.css";

const MetricCard = ({ label, value, sub, accent = false }) => (
  <div className={`${styles.card} ${accent ? styles.cardAccent : ""}`}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value}</span>
    {sub && <span className={styles.sub}>{sub}</span>}
  </div>
);

export default MetricCard;
