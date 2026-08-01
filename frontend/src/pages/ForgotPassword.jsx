import { useState } from "react";
import AuthShell, {
  AuthAlert,
  AuthButton,
  authInputClass,
  authLabelClass,
} from "../components/AuthShell";
import api from "../api/axios";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/forgot-password", { identifier: identifier.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // The server answers identically for unknown accounts, so the confirmation
  // must stay vague too — naming the address would undo that.
  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If that account exists, a reset link is on its way.">
        <AuthAlert tone="success">
          The link expires in 1 hour and can only be used once. If nothing arrives, check your
          spam folder or confirm you typed the right address.
        </AuthAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email or staff ID and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className={authLabelClass}>
            Email or Staff ID
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or DOC-2026-0001"
            required
            autoComplete="username"
            autoFocus
            className={authInputClass}
          />
        </div>

        {error && <AuthAlert>{error}</AuthAlert>}

        <AuthButton type="submit" loading={loading} loadingLabel="Sending…">
          Send reset link →
        </AuthButton>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
