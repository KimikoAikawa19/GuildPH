import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) apiRequest<any>(`/users/${encodeURIComponent(username)}`, undefined).then(setProfile).catch((reason) => setError(reason.message));
  }, [username]);

  return (
    <main className="public-profile">
      {error && <div className="form-alert error">{error}</div>}
      {profile && (
        <section className="profile-card">
          <div className="profile-avatar">{profile.profilePictureUrl ? <img src={profile.profilePictureUrl} alt="" /> : profile.displayName?.slice(0, 1)}</div>
          <span className="eyebrow">@{profile.username}</span>
          <h1>{profile.displayName}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          {profile.region && <p className="muted">{profile.region}, Philippines</p>}
        </section>
      )}
    </main>
  );
}
