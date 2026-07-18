import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const TYPE_COLORS = {
  appointment: "bg-blue-500/10 text-blue-400",
  prescription: "bg-purple-500/10 text-purple-400",
  lab_test: "bg-cyan-500/10 text-cyan-400",
  referral: "bg-amber-500/10 text-amber-400",
  invoice: "bg-green-500/10 text-green-500",
  system: "bg-white/10 text-[#aaa]",
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn("[NotificationBell] fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      if (res.data?.success) setUnreadCount(res.data.unreadCount);
    } catch {
      // silent — the badge is a nice-to-have
    }
  }, []);

  // Initial + polling every 30s for the badge
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Full fetch when the dropdown opens
  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch (err) {
        console.warn("[NotificationBell] markRead failed:", err.message);
      }
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn("[NotificationBell] markAllRead failed:", err.message);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#888] hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-green-500 font-semibold hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-xs text-[#666]">Loading…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-[#555]">No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1a1a1a] last:border-none hover:bg-white/[0.02] flex gap-3 transition-colors cursor-pointer ${
                    n.isRead ? "" : "bg-white/[0.015]"
                  }`}
                >
                  <span
                    className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                      n.isRead ? "bg-transparent" : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          TYPE_COLORS[n.type] ?? TYPE_COLORS.system
                        }`}
                      >
                        {n.type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-[#555]">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className={`text-sm font-medium mt-1 ${n.isRead ? "text-[#aaa]" : "text-white"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-[#777] mt-0.5 truncate">{n.body}</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
