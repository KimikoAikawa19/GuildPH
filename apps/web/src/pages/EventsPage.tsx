import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function EventsPage() {
  const { getIdToken } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<any[]>("/events", undefined).then(setEvents).catch((reason) => setError(reason.message));
  }, []);
  async function register(id: string) {
    try { await apiRequest(`/events/${id}/register`, await getIdToken(), { method: "POST", body: "{}" }); }
    catch (reason: any) { setError(reason.message); }
  }
  return (
    <main className="feature-page">
      <header className="feature-hero compact"><span className="eyebrow">GAMING CALENDAR</span><h1>Upcoming events</h1></header>
      {error && <div className="form-alert error">{error}</div>}
      {!events.length && <div className="empty-panel">No upcoming events are currently published.</div>}
      <div className="feature-grid">{events.map((event) => <article className="event-card reveal" key={event.id}><div className="event-date"><strong>{new Date(event.start_at).getDate()}</strong><span>{new Date(event.start_at).toLocaleString("en-PH", { month: "short" })}</span></div><div><h2>{event.title}</h2><p>{event.location ?? "Online"}</p><button className="button button-outline" type="button" onClick={() => register(event.id)}>Register</button></div></article>)}</div>
    </main>
  );
}
