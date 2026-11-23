import { useEffect, useState, type FormEvent } from "react";
import { sendPasswordResetEmail, sendEmailVerification, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";
import { auth, firebaseConfigured } from "../firebase";

export default function SettingsPage() {
  const { firebaseUser, getIdToken, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [region, setRegion] = useState("");
  const [favoriteGames, setFavoriteGames] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [privacy, setPrivacy] = useState({ publicProfile: true, publicRegion: true, publicFavoriteGames: true, publicSocialLinks: true });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getIdToken().then((token) => {
      apiRequest<any>("/users/me", token).then((account) => {
        setDisplayName(account.display_name ?? "");
        setUsername(account.username ?? "");
        setBio(account.bio ?? "");
        setRegion(account.region ?? "");
        setFavoriteGames(Array.isArray(account.favorite_games) ? account.favorite_games.join(", ") : "");
        setDiscordUsername(account.discord_username ?? "");
        setFacebookUrl(account.facebook_url ?? "");
        setSocialLinks(account.social_links ? JSON.stringify(account.social_links) : "");
      }).catch((reason) => setError(reason.message));
      apiRequest<any>("/users/me/settings", token).then((settings) => {
        if (settings.privacy) setPrivacy({
          publicProfile: settings.privacy.public_profile,
          publicRegion: settings.privacy.public_region,
          publicFavoriteGames: settings.privacy.public_favorite_games,
          publicSocialLinks: settings.privacy.public_social_links
        });
      }).catch(() => undefined);
    });
  }, [getIdToken]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const token = await getIdToken();
      await apiRequest("/users/me", token, {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          username,
          bio,
          region,
          favoriteGames: favoriteGames.split(",").map((game) => game.trim()).filter(Boolean),
          discordUsername,
          facebookUrl: facebookUrl || "",
          socialLinks: (() => {
            try { return socialLinks ? JSON.parse(socialLinks) : {}; }
            catch { return {}; }
          })()
        })
      });
      setMessage("Profile changes saved.");
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  async function savePrivacy() {
    setError("");
    setMessage("");
    try {
      await apiRequest("/users/me/privacy", await getIdToken(), { method: "PATCH", body: JSON.stringify(privacy) });
      setMessage("Privacy settings saved.");
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  async function resetPassword() {
    if (!firebaseConfigured || !auth) {
      setError("Firebase Authentication is not configured.");
      return;
    }
    if (!firebaseUser?.email) return;
    await sendPasswordResetEmail(auth, firebaseUser.email);
    setMessage("Password reset instructions have been sent.");
  }

  async function resendVerification() {
    if (!firebaseUser) return;
    await sendEmailVerification(firebaseUser);
    setMessage("A new verification email has been sent.");
  }

  async function deleteRequest() {
    const password = window.prompt("Re-enter your password to confirm account deletion");
    if (!password || !firebaseUser?.email) return;
    try {
      await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, password));
      await apiRequest("/users/me/delete-request", await getIdToken(), { method: "POST", body: JSON.stringify({ reason: "User requested account deletion" }) });
      setMessage("Account deletion request submitted. It will be reviewed according to GuildPH's retention policy.");
    } catch {
      setError("Account could not be reauthenticated. No deletion request was submitted.");
    }
  }

  return (
    <main className="dashboard-layout settings-layout">
      <section className="dashboard-content wide">
        <span className="eyebrow">ACCOUNT SETTINGS</span>
        <h1>Settings</h1>
        {message && <div className="form-alert success">{message}</div>}
        {error && <div className="form-alert error">{error}</div>}
        <form className="settings-card" onSubmit={saveProfile}>
          <h2>Profile settings</h2>
          <div className="form-grid">
            <label>Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></label>
            <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          </div>
          <label>Biography<textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} /></label>
          <div className="form-grid">
            <label>Region<input value={region} onChange={(e) => setRegion(e.target.value)} /></label>
            <label>Favorite games<input value={favoriteGames} onChange={(e) => setFavoriteGames(e.target.value)} placeholder="Valorant, Mobile Legends" /></label>
          </div>
          <div className="form-grid">
            <label>Discord username<input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} /></label>
            <label>Facebook profile URL<input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." /></label>
          </div>
          <label>Additional social links JSON<textarea value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder='{"twitch":"https://twitch.tv/..."}' /></label>
          <button className="button button-primary" type="submit">Save profile</button>
        </form>
        <section className="settings-card">
          <h2>Security</h2>
          <p>Signed in as <strong>{firebaseUser?.email}</strong></p>
          <div className="settings-actions">
            <button className="button button-outline" type="button" onClick={resetPassword}>Send password reset email</button>
            {!firebaseUser?.emailVerified && <button className="button button-outline" type="button" onClick={resendVerification}>Resend email verification</button>}
          </div>
        </section>
        <section className="settings-card">
          <h2>Privacy</h2>
          {Object.entries(privacy).map(([key, value]) => (
            <label className="check-label" key={key}>
              <input type="checkbox" checked={value} onChange={(e) => setPrivacy((current) => ({ ...current, [key]: e.target.checked }))} />
              <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</span>
            </label>
          ))}
          <button className="button button-outline" type="button" onClick={savePrivacy}>Save privacy</button>
        </section>
        <section className="settings-card danger-card">
          <h2>Account management</h2>
          <p>Deleting or anonymizing an account is subject to GuildPH's privacy and retention policy.</p>
          <button className="button button-danger" type="button" onClick={deleteRequest}>Request account deletion</button>
          <button className="text-button" type="button" onClick={async () => { await logout(); window.location.href = "/"; }}>Sign out</button>
        </section>
      </section>
    </main>
  );
}
