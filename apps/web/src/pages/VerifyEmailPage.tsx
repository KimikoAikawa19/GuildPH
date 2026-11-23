import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reload, sendEmailVerification } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage() {
  const { firebaseUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function resend() {
    setError("");
    try {
      if (!firebaseUser) throw new Error();
      await sendEmailVerification(firebaseUser);
      setMessage("A new verification email has been sent.");
    } catch {
      setError("The verification email could not be sent. Please try again later.");
    }
  }

  async function refreshStatus() {
    setError("");
    try {
      if (!firebaseUser) throw new Error();
      await reload(firebaseUser);
      if (firebaseUser.emailVerified) navigate("/dashboard");
      else setMessage("Your email is still unverified. Check your inbox and spam folder.");
    } catch {
      setError("Verification status could not be refreshed.");
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <span className="eyebrow">ONE LAST STEP</span>
        <h1>Verify your email</h1>
        <p>We sent a verification link to <strong>{firebaseUser?.email}</strong>.</p>
        {message && <div className="form-alert success">{message}</div>}
        {error && <div className="form-alert error">{error}</div>}
        <button className="button button-primary auth-submit" type="button" onClick={refreshStatus}>I've verified my email</button>
        <button className="button button-outline auth-submit" type="button" onClick={resend}>Resend verification email</button>
        <button className="text-button auth-footer" type="button" onClick={async () => { await logout(); navigate("/login"); }}>Sign out</button>
        <Link className="auth-footer" to="/">Return home</Link>
      </section>
    </main>
  );
}
