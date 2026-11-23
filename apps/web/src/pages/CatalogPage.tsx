import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function CatalogPage({ kind }: { kind: "games" | "categories" }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<any[]>(`/${kind}`, undefined).then(setItems).catch((reason) => setError(reason.message));
  }, [kind]);
  return (
    <main className="feature-page">
      <header className="feature-hero compact"><span className="eyebrow">{kind === "games" ? "GAME CATALOG" : "COMMUNITY CATEGORIES"}</span><h1>{kind === "games" ? "Browse games" : "Explore categories"}</h1></header>
      {error && <div className="form-alert error">{error}</div>}
      <div className="feature-grid compact-grid">
        {items.map((item) => <article className="catalog-card reveal" key={item.id}><div className="catalog-icon">{item.name.slice(0, 1)}</div><h2>{item.name}</h2><p>{item.description ?? "Explore communities supporting this selection."}</p></article>)}
      </div>
    </main>
  );
}
