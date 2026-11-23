import { Link, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import PublicProfilePage from "./pages/PublicProfilePage";

const navItems = ["Discover", "Games", "Communities", "Tournaments", "Events", "Leaderboards", "Premium", "About"];

function Header() {
  const { firebaseUser, loading, logout } = useAuth();
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="GuildPH home">
        <span className="brand-mark">G</span>
        <span>GUILDPH</span>
      </Link>
      <nav aria-label="Main navigation">
        {navItems.map((item) => (
          <Link key={item} to={`/${item.toLowerCase()}`}>{item}</Link>
        ))}
      </nav>
      <div className="header-actions">
        {loading ? null : firebaseUser ? (
          <>
            <Link className="button button-ghost" to="/dashboard">Dashboard</Link>
            <button className="button button-primary" type="button" onClick={async () => logout()}>Log out</button>
          </>
        ) : (
          <>
            <Link className="button button-ghost" to="/login">Log in</Link>
            <Link className="button button-primary" to="/register">Join GuildPH</Link>
          </>
        )}
      </div>
    </header>
  );
}

function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">PHILIPPINE GAMING COMMUNITY NETWORK</div>
        <h1>Find Your Gaming Community.</h1>
        <p>Discover Filipino gaming communities, connect with fellow players, find your next team, and become part of something bigger.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/communities">Explore Communities</Link>
          <Link className="button button-outline" to="/communities/new">Create a Community</Link>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMMUNITY DIRECTORY</span>
            <h2>Discover your next squad</h2>
          </div>
        </div>
        <div className="empty-panel">
          Community listings will appear here once the database and catalog are configured.
        </div>
      </section>
    </main>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main className="placeholder-page">
      <h1>{title}</h1>
      <p>This section is ready for the next implementation phase.</p>
    </main>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        {navItems.map((item) => (
          <Route key={item} path={`/${item.toLowerCase()}`} element={<Placeholder title={item} />} />
        ))}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<SettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/communities/new" element={<Placeholder title="Create a Community" />} />
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Routes>
    </div>
  );
}
