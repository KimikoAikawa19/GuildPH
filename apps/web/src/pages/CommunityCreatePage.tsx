import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function CommunityCreatePage() {
  const { getIdToken } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("English");
  const [platformUrl, setPlatformUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => undefined, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await getIdToken();
      const community = await apiRequest<any>("/communities", token, {
        method: "POST",
        body: JSON.stringify({ name, description, region, language, platformUrl: platformUrl || undefined })
      });
      navigate(`/communities/${community.slug}`);
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="feature-page narrow">
      <header className="feature-hero compact"><span className="eyebrow">BUILD YOUR COMMUNITY</span><h1>Create a community</h1></header>
      <form className="settings-card" onSubmit={submit}>
        {error && <div className="form-alert error">{error}</div>}
        <label>Community name<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={120} required /></label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} maxLength={3000} required /></label>
        <div className="form-grid">
          <label>Region<input value={region} onChange={(event) => setRegion(event.target.value)} required placeholder="Metro Manila" /></label>
          <label>Language<input value={language} onChange={(event) => setLanguage(event.target.value)} required /></label>
        </div>
        <label>Public website or invitation URL<input type="url" value={platformUrl} onChange={(event) => setPlatformUrl(event.target.value)} placeholder="https://" /></label>
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit for approval"}</button>
      </form>
    </main>
  );
}
