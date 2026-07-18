import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AuthShell, { AuthAlert, AuthButton, authInputClass, authLabelClass } from "../components/AuthShell";
import api from "../api/axios";

const ResendForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/resend-verification", { identifier: identifier.trim() });
    } catch {
      // The endpoint is deliberately generic; a failure here tells the user
      // nothing useful, so show the same confirmation either way.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthAlert tone="success">
        If that account still needs verifying, a fresh link is on its way.
      </AuthAlert>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-4 mt-6">
      <div>
        <label htmlFor="identifier" className={authLabelClass}>
          Send a new link to
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          required
          className={authInputClass}
        />
      </div>
      <AuthButton type="submit" loading={loading} loadingLabel="Sending…">
        Resend verification link
      </AuthButton>
    </form>
  );
};

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [error, setError] = useState("");

  // Verification tokens are single-use. StrictMode runs effects twice in dev,
  // which would burn the token on the first pass and report the second as a
  // failure — so the request is fired at most once per mount.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    api
      .post("/verify-email", { token })
      .then(() => setStatus("verified"))
      .catch((err) => {
        setError(err.response?.data?.message || "This verification link is invalid or has expired.");
        setStatus("failed");
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying your email" subtitle="One moment…">
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-green-500 rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (status === "verified") {
    return (
      <AuthShell title="Email verified" subtitle="Your account is confirmed.">
        <AuthAlert tone="success">
          Thanks — you'll now get appointment, prescription, and billing updates by email.
        </AuthAlert>
        <div className="mt-6">
          <Link to="/login">
            <AuthButton type="button">Continue to sign in →</AuthButton>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={status === "missing" ? "Link is incomplete" : "Verification failed"}
      subtitle={
        status === "missing"
          ? "This verification link is missing its token."
          : "That link didn't work."
      }
    >
      <AuthAlert>{error || "Open the link straight from your email."}</AuthAlert>
      <ResendForm />
    </AuthShell>
  );
};

export default VerifyEmail;
