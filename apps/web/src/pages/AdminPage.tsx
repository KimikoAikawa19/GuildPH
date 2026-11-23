import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function AdminPage({ owner = false }: { owner?: boolean }) {
  const { getIdToken } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getIdToken().then((token) => apiRequest<any>("/admin/overview", token).then(setOverview).catch((reason) => setError(reason.message)));
  }, [getIdToken]);
  return (
    <main className="dashboard-layout">
      <aside className="dashboard-sidebar"><strong>{owner ? "OWNER" : "ADMIN"}</strong><nav><span>Overview</span><span>Users</span><span>Communities</span><span>Reports</span><span>Audit logs</span></nav></aside>
      <section className="dashboard-content">
        <span className="eyebrow">PROTECTED PLATFORM PANEL</span><h1>{owner ? "Owner control" : "Administrator"}</h1>
        {error && <div className="form-alert error">{error}</div>}
        {overview && <div className="dashboard-grid"><article className="dashboard-card"><h2>Users</h2><strong>{overview.users}</strong></article><article className="dashboard-card"><h2>Communities</h2><strong>{overview.communities}</strong></article><article className="dashboard-card"><h2>Pending submissions</h2><strong>{overview.pending_communities}</strong></article><article className="dashboard-card"><h2>Reports</h2><strong>{overview.reports}</strong></article></div>}
      </section>
    </main>
  );
}
