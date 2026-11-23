import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function TournamentsPage() {
  const { getIdToken } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<any[]>("/tournaments", undefined).then(setTournaments).catch((reason) => setError(reason.message));
  }, []);
  async function register(id: string) {
    const teamName = window.prompt("Team name");
    if (!teamName) return;
    try { await apiRequest(`/tournaments/${id}/register`, await getIdToken(), { method: "POST", body: JSON.stringify({ teamName }) }); }
    catch (reason: any) { setError(reason.message); }
  }
  return (
    <main className="feature-page">
      <header className="feature-hero compact"><span className="eyebrow">COMPETITIVE PLAY</span><h1>Tournaments</h1></header>
      {error && <div className="form-alert error">{error}</div>}
      {!tournaments.length && <div className="empty-panel">No tournaments are currently accepting registration.</div>}
      <div className="feature-grid">{tournaments.map((tournament) => <article className="event-card reveal" key={tournament.id}><div className="event-date"><strong>{new Date(tournament.start_at).getDate()}</strong><span>{new Date(tournament.start_at).toLocaleString("en-PH", { month: "short" })}</span></div><div><h2>{tournament.title}</h2><p>{tournament.format.replaceAll("_", " ")}</p><button className="button button-outline" type="button" onClick={() => register(tournament.id)}>Register team</button></div></article>)}</div>
    </main>
  );
}
