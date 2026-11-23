import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth, firebaseConfigured, setSessionPersistence } from "../firebase";
import { apiRequest } from "../services/api";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!firebaseConfigured || !auth) {
      setError("Firebase Authentication is not configured.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError("Username must be 3–30 characters using letters, numbers, or underscores.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters and include a letter and number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }
    try {
      await setSessionPersistence(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
      const token = await credential.user.getIdToken();
      await apiRequest("/auth/session/verify", token);
      await apiRequest("/users/me", token, {
        method: "PATCH",
        body: JSON.stringify({ displayName, username })
      });
      navigate("/verify-email");
    } catch (reason: any) {
      if (reason.code === "auth/email-already-in-use") setError("An account already exists for this email.");
      else setError("Registration could not be completed. Please check your details.");
    }
  }

  return (
    <main className="auth-layout">
      <form className="auth-card register-card" onSubmit={submit}>
        <Link className="auth-brand" to="/">GUILDPH</Link>
        <span className="eyebrow">CREATE YOUR ACCOUNT</span>
        <h1>Join GuildPH</h1>
        {error && <div className="form-alert error" role="alert">{error}</div>}
        <div className="form-grid">
          <label>Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={80} required /></label>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
        </div>
        <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <div className="form-grid">
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></label>
          <label>Confirm password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" /></label>
        </div>
        <label className="check-label terms">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>I accept the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
        </label>
        <button className="button button-primary auth-submit" type="submit">Create account</button>
        <p className="auth-footer">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </main>
  );
}
