import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function NotificationsPage() {
  const { getIdToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getIdToken().then((token) => apiRequest<any[]>("/users/me/notifications", token).then(setNotifications).catch((reason) => setError(reason.message)));
  }, [getIdToken]);
  return (
    <main className="feature-page narrow">
      <header className="feature-hero compact"><span className="eyebrow">ACCOUNT ACTIVITY</span><h1>Notifications</h1></header>
      {error && <div className="form-alert error">{error}</div>}
      {!notifications.length && <div className="empty-panel">You have no notifications.</div>}
      <div className="notification-list">{notifications.map((item) => <article className="notification-card reveal" key={item.id}><span className={!item.is_read ? "notification-dot" : ""} /><div><h2>{item.title}</h2><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString("en-PH")}</small></div></article>)}</div>
    </main>
  );
}
