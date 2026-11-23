import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

export default function PremiumPage() {
  const { getIdToken } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<any[]>("/plans", undefined).then((data) => setPlans(Array.isArray(data) ? data : [])).catch((reason) => setError(reason.message));
  }, []);

  async function checkout() {
    try {
      await apiRequest("/subscriptions/checkout", await getIdToken(), { method: "POST", body: "{}" });
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  return (
    <main className="feature-page">
      <header className="feature-hero premium-hero"><span className="eyebrow">GUILDPH PREMIUM</span><h1>Build a stronger community</h1><p>Promotional tools and advanced management for growing Filipino gaming organizations.</p></header>
      {error && <div className="form-alert error">{error}</div>}
      <div className="premium-grid">
        {plans.map((plan) => (
          <article className="premium-card reveal" key={plan.id}>
            <span className="eyebrow">{plan.name}</span><h2>₱{Number(plan.price).toLocaleString("en-PH")}<small>/month</small></h2>
            <ul>{(Array.isArray(plan.benefits) ? plan.benefits : []).map((benefit: string) => <li key={benefit}>{benefit}</li>)}</ul>
            <button className="button button-primary" type="button" onClick={checkout}>Configure payment provider</button>
          </article>
        ))}
      </div>
    </main>
  );
}
