import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const { getIdToken } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) apiRequest<any>(`/communities/${encodeURIComponent(slug)}`, undefined).then(setCommunity).catch((reason) => setError(reason.message));
  }, [slug]);

  async function save(action: "follow" | "save") {
    if (!community?.id) return;
    try { await apiRequest(`/communities/${community.id}/${action}`, await getIdToken(), { method: "POST", body: "{}" }); }
    catch (reason: any) { setError(reason.message); }
  }

  return (
    <main className="feature-page narrow">
      {error && <div className="form-alert error">{error}</div>}
      {community && (
        <article className="community-detail reveal">
          <div className="community-detail-banner"><div className="community-card-art"><span>{community.name.slice(0,1)}</span></div></div>
          <div className="community-detail-body">
            <span className="eyebrow">{community.primary_game_name ?? "Gaming community"}</span>
            <h1>{community.name}</h1>
            <p>{community.description}</p>
            <div className="settings-actions"><button className="button button-primary" type="button" onClick={() => save("follow")}>Follow</button><button className="button button-outline" type="button" onClick={() => save("save")}>Save</button></div>
          </div>
        </article>
      )}
    </main>
  );
}
