import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { auth, firebaseConfigured, setSessionPersistence } from "../firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!firebaseConfigured || !auth) {
      setError("Firebase Authentication is not configured.");
      return;
    }
    try {
      await setSessionPersistence(remember);
      await signInWithEmailAndPassword(auth, email, password);
      navigate(destination, { replace: true });
    } catch (reason: any) {
      setError(reason.code === "auth/invalid-credential"
        ? "The email or password is incorrect."
        : "Unable to sign in. Please try again.");
    }
  }

  async function googleSignIn() {
    setError("");
    if (!firebaseConfigured || !auth) {
      setError("Firebase Authentication is not configured.");
      return;
    }
    try {
      await setSessionPersistence(remember);
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate(destination, { replace: true });
    } catch {
      setError("Google sign-in could not be completed.");
    }
  }

  async function forgotPassword() {
    setError("");
    setMessage("");
    if (!firebaseConfigured || !auth) {
      setError("Firebase Authentication is not configured.");
      return;
    }
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("If an account exists for this email, a password reset link has been sent.");
    } catch {
      setError("Password reset could not be requested.");
    }
  }

  return (
    <main className="auth-layout">
      <form className="auth-card" onSubmit={submit}>
        <Link className="auth-brand" to="/">GUILDPH</Link>
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Log in</h1>
        {error && <div className="form-alert error" role="alert">{error}</div>}
        {message && <div className="form-alert success" role="status">{message}</div>}
        <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password
          <span className="password-field">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
          </span>
        </label>
        <div className="form-options">
          <label className="check-label"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
          <button type="button" className="text-button" onClick={forgotPassword}>Forgot password?</button>
        </div>
        <button className="button button-primary auth-submit" type="submit">Log in</button>
        <button className="button button-outline auth-submit" type="button" onClick={googleSignIn}>Continue with Google</button>
        <p className="auth-footer">New to GuildPH? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
