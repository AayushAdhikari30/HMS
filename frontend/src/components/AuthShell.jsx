import { Link } from "react-router-dom";

const HospitalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// Centred card on the same backdrop as the login screen. Shared by the
// forgot-password, reset-password, and verify-email pages.
const AuthShell = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 py-12">
    <div
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/dhulikhel-hospital.jpg.png')" }}
    />
    <div className="absolute inset-0 z-0 bg-[#0a0a0a]/80" />
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 65% at 50% 45%, transparent 0%, rgba(10,10,10,0.6) 70%, rgba(10,10,10,0.95) 100%)",
      }}
    />
    <div className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-green-500/20 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute top-1/3 -right-40 w-[34rem] h-[34rem] bg-emerald-500/20 rounded-full blur-[140px] mix-blend-screen" />
    </div>

    <div className="relative z-10 w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <HospitalIcon />
        <span className="text-white font-bold text-lg tracking-tight">
          Medi<span className="text-green-500">Care</span>
          <span className="text-[#555] font-normal ml-1 text-sm">HMS</span>
        </span>
      </div>

      <div className="bg-[#0d0d0d]/90 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl px-8 py-10">
        <h1 className="text-white text-2xl font-bold tracking-tight mb-1">{title}</h1>
        {subtitle && <p className="text-[#666] text-sm mb-8">{subtitle}</p>}
        {children}
      </div>

      <p className="text-center text-[#555] text-xs mt-6">
        <Link to="/login" className="text-green-500/80 hover:text-green-400 transition-colors duration-150">
          ← Back to sign in
        </Link>
      </p>
    </div>
  </div>
);

export const authInputClass = `
  w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-3
  text-white placeholder-[#444] text-sm outline-none
  focus:border-green-500 focus:ring-1 focus:ring-green-500/20
  transition-all duration-200 [color-scheme:dark]
`;

export const authLabelClass =
  "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

export const AuthButton = ({ loading, loadingLabel, children, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="
      w-full py-3.5 rounded-lg font-semibold text-sm
      bg-green-500/10 text-green-500 border border-green-500/40
      hover:bg-green-500 hover:text-black hover:border-green-500
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-all duration-200 cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-green-500/50
      flex items-center justify-center gap-2
    "
  >
    {loading ? (
      <>
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        {loadingLabel}
      </>
    ) : (
      children
    )}
  </button>
);

export const AuthAlert = ({ tone = "error", children }) => {
  const tones = {
    error: { wrap: "bg-red-500/8 border-red-500/20", text: "text-red-400", stroke: "#f87171" },
    success: { wrap: "bg-green-500/8 border-green-500/20", text: "text-green-400", stroke: "#4ade80" },
  };
  const t = tones[tone] ?? tones.error;

  return (
    <div role="alert" className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${t.wrap}`}>
      <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        {tone === "success" ? (
          <polyline points="8 12 11 15 16 9" />
        ) : (
          <>
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        )}
      </svg>
      <p className={`${t.text} text-sm`}>{children}</p>
    </div>
  );
};

export default AuthShell;
