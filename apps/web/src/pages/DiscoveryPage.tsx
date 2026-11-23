import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

type Community = { id: string; name: string; slug: string; description: string; primary_game_name?: string; member_count?: number; featured_status: boolean; verification_status: string };

export default function DiscoveryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState("");
  const [game, setGame] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Community[]>("/communities", undefined)
      .then(setCommunities)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = communities.filter((community) =>
    (!game || community.primary_game_name === game) &&
    `${community.name} ${community.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="feature-page">
      <header className="feature-hero">
        <span className="eyebrow">COMMUNITY DIRECTORY</span>
        <h1>Discover your next squad</h1>
        <p>Find Filipino gaming communities built around the games you play.</p>
        <div className="directory-controls">
          <input aria-label="Search communities" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or description" />
          <input aria-label="Filter game" value={game} onChange={(event) => setGame(event.target.value)} placeholder="Filter by game" />
        </div>
      </header>
      {loading && <div className="feature-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
      {error && <div className="form-alert error">{error}</div>}
      {!loading && !error && !filtered.length && (
        <div className="empty-panel">No communities match your search. Add the first verified community to start the directory.</div>
      )}
      <div className="feature-grid">
        {filtered.map((community) => (
          <Link className="community-card reveal" key={community.id} to={`/communities/${community.slug}`}>
            <div className="community-card-art"><span>{community.name.slice(0, 1)}</span></div>
            <div className="community-card-body">
              <div className="card-meta">
                {community.featured_status && <span>Featured</span>}
                {community.verification_status === "verified" && <span>Verified</span>}
              </div>
              <h2>{community.name}</h2>
              <p>{community.description}</p>
              <small>{community.primary_game_name ?? "Multi-game"} · {community.member_count ? `${community.member_count} members` : "Member count not provided"}</small>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
