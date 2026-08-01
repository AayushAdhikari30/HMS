import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  accepted: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-400",
};

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TABS = [
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
];

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
      STATUS_STYLES[status] ?? "bg-white/5 text-[#888]"
    }`}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);

const ReceivedRow = ({ referral, onUpdate, busy }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{referral.patient?.name ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      {referral.referringDoctor?.name ?? "—"}
      {referral.referringDoctor?.department ? ` · ${referral.referringDoctor.department}` : ""}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle max-w-xs">{referral.reason}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDateTime(referral.createdAt)}</td>
    <td className="px-5 py-3.5 align-middle">
      <StatusPill status={referral.status} />
    </td>
    <td className="px-5 py-3.5 align-middle">
      <div className="flex gap-2 flex-wrap">
        {referral.status === "pending" && (
          <>
            <button
              onClick={() => onUpdate(referral.id, "accepted")}
              disabled={busy}
              className="border border-blue-500/40 text-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-blue-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              Accept
            </button>
            <button
              onClick={() => onUpdate(referral.id, "cancelled")}
              disabled={busy}
              className="border border-red-500/40 text-red-400 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}
        {referral.status === "accepted" && (
          <button
            onClick={() => onUpdate(referral.id, "completed")}
            disabled={busy}
            className="border border-green-500/40 text-green-500 rounded-md px-2.5 py-1 text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            Mark Completed
          </button>
        )}
        {(referral.status === "completed" || referral.status === "cancelled") && (
          <span className="text-xs text-[#555]">—</span>
        )}
      </div>
    </td>
  </tr>
);

const SentRow = ({ referral }) => (
  <tr className="border-b border-[#1a1a1a] last:border-none">
    <td className="px-5 py-3.5 text-sm font-medium text-[#ddd] align-middle">{referral.patient?.name ?? "—"}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">
      {referral.referredDoctor?.name ?? "—"}
      {referral.referredDoctor?.department ? ` · ${referral.referredDoctor.department}` : ""}
    </td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle max-w-xs">{referral.reason}</td>
    <td className="px-5 py-3.5 text-sm text-[#999] align-middle">{formatDateTime(referral.createdAt)}</td>
    <td className="px-5 py-3.5 align-middle">
      <StatusPill status={referral.status} />
    </td>
  </tr>
);

const DoctorReferrals = () => {
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recvRes, sentRes] = await Promise.all([
        api.get("/referrals", { params: { direction: "received" } }),
        api.get("/referrals", { params: { direction: "sent" } }),
      ]);
      if (recvRes.data?.success) setReceived(recvRes.data.referrals);
      if (sentRes.data?.success) setSent(sentRes.data.referrals);
    } catch (err) {
      console.warn("[DoctorReferrals] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUpdate = async (id, status) => {
    setBusyId(id);
    try {
      await api.patch(`/referrals/${id}/status`, { status });
      await fetchAll();
    } catch (err) {
      console.error("[DoctorReferrals] update failed:", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const rows = tab === "received" ? received : sent;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">Referrals</h2>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150 cursor-pointer ${
                tab === t.key
                  ? "bg-green-500 border-green-500 text-black"
                  : "border-[#2a2a2a] text-[#888] hover:border-green-500/40 hover:text-green-500"
              }`}
            >
              {t.label} {t.key === "received" ? `(${received.length})` : `(${sent.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {(tab === "received"
                ? ["Patient", "From", "Reason", "Date", "Status", "Actions"]
                : ["Patient", "To", "Reason", "Date", "Status"]
              ).map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold uppercase tracking-widest text-[#666] px-5 py-3.5 bg-white/[0.02] border-b border-[#1a1a1a]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  Loading referrals…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#666]">
                  {tab === "received" ? "No referrals received yet." : "You haven't referred any patients yet."}
                </td>
              </tr>
            )}
            {!loading &&
              tab === "received" &&
              rows.map((r) => (
                <ReceivedRow key={r.id} referral={r} onUpdate={handleUpdate} busy={busyId === r.id} />
              ))}
            {!loading && tab === "sent" && rows.map((r) => <SentRow key={r.id} referral={r} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorReferrals;
