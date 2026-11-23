import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

type Account = {
  username: string;
  display_name: string;
  bio: string | null;
  profile_completion: number;
  favorite_games: string[];
  email_verified: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const { firebaseUser, getIdToken } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getIdToken().then((token) =>
      apiRequest<Account>("/users/me", token).then(setAccount).catch((reason) => setError(reason.message))
    );
  }, [getIdToken]);

  return (
    <main className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand" to="/"><span className="brand-mark">G</span>GUILDPH</Link>
        <nav>
          <Link to="/dashboard">Overview</Link>
          <Link to="/profile">My profile</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/communities">Discover</Link>
        </nav>
      </aside>
      <section className="dashboard-content">
        {error && <div className="form-alert error">{error}</div>}
        <span className="eyebrow">ACCOUNT OVERVIEW</span>
        <h1>Welcome{account?.display_name ? `, ${account.display_name}` : ""}</h1>
        {firebaseUser?.emailVerified === false && (
          <div className="form-alert">Verify your email to unlock restricted account features. <Link to="/verify-email">Verify now</Link></div>
        )}
        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2>Profile completion</h2>
            <strong>{account?.profile_completion ?? 0}%</strong>
            <div className="progress-track"><span style={{ width: `${account?.profile_completion ?? 0}%` }} /></div>
            <Link className="button button-outline" to="/settings">Edit profile</Link>
          </section>
          <section className="dashboard-card">
            <h2>Favorite games</h2>
            {account?.favorite_games?.length ? <div className="tag-list">{account.favorite_games.map((game) => <span key={game}>{game}</span>)}</div> : <p className="muted">No favorite games added yet.</p>}
          </section>
          <section className="dashboard-card">
            <h2>Saved communities</h2>
            <p className="muted">You have not saved any communities yet.</p>
            <Link className="text-button" to="/communities">Discover communities</Link>
          </section>
          <section className="dashboard-card">
            <h2>Recent notifications</h2>
            <p className="muted">No recent notifications.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
