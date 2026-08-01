import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { AuthAlert, authInputClass, authLabelClass } from "./AuthShell";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const SectionCard = ({ title, children }) => (
  <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 flex flex-col gap-4">
    <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
    {children}
  </div>
);

const SaveButton = ({ loading, children, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="
      self-start bg-green-500/10 text-green-500 border border-green-500/40
      hover:bg-green-500 hover:text-black hover:border-green-500
      disabled:opacity-50 disabled:cursor-not-allowed
      rounded-lg px-4 py-2 text-sm font-semibold
      transition-all duration-200 cursor-pointer
    "
  >
    {loading ? "Saving…" : children}
  </button>
);

const ContactSection = ({ profile, onUpdated }) => {
  const [phone, setPhone] = useState(profile.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await api.patch("/profile", { phone });
      onUpdated(res.data.phone);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update phone number");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Contact information">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label htmlFor="profile-phone" className={authLabelClass}>
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSuccess(false);
            }}
            placeholder="98XXXXXXXX"
            className={authInputClass}
          />
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
        {success && <AuthAlert tone="success">Phone number updated.</AuthAlert>}
        <SaveButton type="submit" loading={saving}>
          Save phone number
        </SaveButton>
      </form>
    </SectionCard>
  );
};

const PasswordSection = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/profile/password", { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Change password">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label htmlFor="current-password" className={authLabelClass}>
            Current password
          </label>
          <input
            id="current-password"
            type={show ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="new-password" className={authLabelClass}>
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((p) => !p)}
              aria-label={show ? "Hide passwords" : "Show passwords"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors cursor-pointer"
            >
              {show ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className={authLabelClass}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={authInputClass}
          />
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
        {success && (
          <AuthAlert tone="success">
            Password changed. You'll need to sign in again on your other devices.
          </AuthAlert>
        )}
        <SaveButton type="submit" loading={saving}>
          Update password
        </SaveButton>
      </form>
    </SectionCard>
  );
};

const ProfileModal = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/profile")
      .then((res) => {
        if (!cancelled) setProfile(res.data.profile);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your profile. Try again shortly.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight">My Profile</h2>
            {user && (
              <p className="text-[#666] text-sm">
                {user.name} · <span className="capitalize">{user.role}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#666] hover:text-white transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {loadError && <AuthAlert>{loadError}</AuthAlert>}

        {!profile && !loadError && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-[#2a2a2a] border-t-green-500 rounded-full animate-spin" />
          </div>
        )}

        {profile && (
          <>
            <div className="text-xs text-[#666] bg-[#111111] border border-[#1a1a1a] rounded-lg px-3.5 py-2.5">
              <span className="text-[#888]">Login ID:</span>{" "}
              <span className="font-mono text-[#ccc]">{profile.identifier}</span>
              {profile.email && profile.email !== profile.identifier && (
                <>
                  <br />
                  <span className="text-[#888]">Email:</span> <span className="text-[#ccc]">{profile.email}</span>
                </>
              )}
            </div>
            <ContactSection profile={profile} onUpdated={(phone) => setProfile((p) => ({ ...p, phone }))} />
            <PasswordSection />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
