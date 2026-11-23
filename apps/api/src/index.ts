import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { createRemoteJWKSet, jwtVerify } from "jose";

type Bindings = {
  DATABASE_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  APP_ORIGINS?: string;
  API_VERSION?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", secureHeaders());
app.use("/api/*", cors({
  origin: (origin, c) => {
    if (!origin) return origin ?? "";
    try {
      const url = new URL(origin);
      const configured = (c.env?.APP_ORIGINS ?? "")
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
      const approved = ["localhost", "127.0.0.1"].includes(url.hostname) ||
        configured.includes(origin.replace(/\/$/, ""));
      return approved ? origin : "";
    } catch {
      return "";
    }
  }
}));

app.get("/health", (c) => c.json({ data: { status: "ok" } }));
app.get("/api/v1/health", (c) => c.json({ data: { status: "ok" } }));

const firebaseJWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyFirebaseToken(c: any) {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  if (!c.env?.FIREBASE_PROJECT_ID) return null;

  try {
    const token = authorization.slice(7);
    const { payload } = await jwtVerify(token, firebaseJWKS, {
      issuer: `https://securetoken.google.com/${c.env.FIREBASE_PROJECT_ID}`,
      audience: c.env.FIREBASE_PROJECT_ID
    });
    if (typeof payload.sub !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/).optional(),
  bio: z.string().trim().max(500).optional(),
  country: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  favoriteGames: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  discordUsername: z.string().trim().max(100).optional(),
  facebookUrl: z.string().url().startsWith("https://").optional().or(z.literal("")),
  socialLinks: z.record(z.string().url().startsWith("https://")).optional()
}).strict();

const privacySchema = z.object({
  publicProfile: z.boolean().optional(),
  publicRegion: z.boolean().optional(),
  publicFavoriteGames: z.boolean().optional(),
  publicSocialLinks: z.boolean().optional()
}).strict();

async function provisionUser(c: any, claims: any) {
  if (!c.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const sql = neon(c.env.DATABASE_URL);
  const firebaseUid = String(claims.sub);
  const email = typeof claims.email === "string" ? claims.email : "";
  const displayName = typeof claims.name === "string" && claims.name.trim()
    ? claims.name.trim().slice(0, 80)
    : email.split("@")[0] || "GuildPH Player";
  const usernameBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24) || "player";
  const username = `${usernameBase}_${firebaseUid.slice(0, 6).toLowerCase()}`;

  await sql`
    INSERT INTO users (
      firebase_uid, username, display_name, email, avatar_url, email_verified
    ) VALUES (
      ${firebaseUid}, ${username}, ${displayName}, ${email},
      ${typeof claims.picture === "string" ? claims.picture : null},
      ${claims.email_verified === true}
    )
    ON CONFLICT (firebase_uid) DO UPDATE SET
      email = EXCLUDED.email,
      avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url),
      email_verified = EXCLUDED.email_verified,
      updated_at = NOW()
  `;

  const existing = await sql`
    SELECT u.*, up.public_profile, up.public_region, up.public_favorite_games, up.public_social_links
    FROM users u
    LEFT JOIN user_privacy up ON up.user_id = u.id
    WHERE u.firebase_uid = ${firebaseUid}
  `;
  const user = existing[0];
  if (!user) throw new Error("USER_PROVISION_FAILED");

  await sql`
    INSERT INTO user_privacy (user_id)
    VALUES (${user.id})
    ON CONFLICT (user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO notification_preferences (user_id)
    VALUES (${user.id})
    ON CONFLICT (user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO user_roles (user_id, role_id)
    SELECT ${user.id}, r.id
    FROM roles r
    WHERE r.name = 'USER'
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;
  return user;
}

async function authenticatedUser(c: any) {
  const claims = await verifyFirebaseToken(c);
  if (!claims) return { claims: null, user: null };
  if (!c.env.DATABASE_URL) return { claims, user: null };
  try {
    const user = await provisionUser(c, claims);
    return { claims, user };
  } catch {
    return { claims, user: null };
  }
}

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

app.get("/api/v1/auth/me", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "A valid Firebase session is required." } }, 401);
  if (!user) return c.json({ error: { code: "DATABASE_NOT_CONFIGURED", message: "Account storage is unavailable." } }, 503);
  return c.json({ data: { firebaseUid: claims.sub, emailVerified: claims.email_verified === true, user } });
});

app.post("/api/v1/auth/session/verify", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "The session could not be verified." } }, 401);
  if (!user) return c.json({ error: { code: "DATABASE_ERROR", message: "The account could not be loaded." } }, 503);
  return c.json({ data: { valid: true, user } });
});

app.get("/api/v1/users/me", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  return c.json({ data: user });
});

app.patch("/api/v1/users/me", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  if (user.status !== "active") return c.json({ error: { code: "ACCOUNT_RESTRICTED", message: "This account cannot modify profile information." } }, 403);

  const body = await c.req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid profile information.", details: parsed.error.flatten() } }, 400);
  }
  const sql = neon(c.env.DATABASE_URL!);

  if (parsed.data.username) {
    const duplicate = await sql`
      SELECT id FROM users
      WHERE lower(username) = lower(${parsed.data.username}) AND id <> ${user.id}
      LIMIT 1
    `;
    if (duplicate.length) return c.json({ error: { code: "USERNAME_TAKEN", message: "That username is already in use." } }, 409);
  }

  await sql`
    UPDATE users SET
      display_name = COALESCE(${parsed.data.displayName ?? null}, display_name),
      username = COALESCE(${parsed.data.username ?? null}, username),
      bio = COALESCE(${parsed.data.bio ?? null}, bio),
      country = COALESCE(${parsed.data.country ?? null}, country),
      region = COALESCE(${parsed.data.region ?? null}, region),
      favorite_games = COALESCE(${parsed.data.favoriteGames ? JSON.stringify(parsed.data.favoriteGames) : null}::jsonb, favorite_games),
      discord_username = COALESCE(${parsed.data.discordUsername ?? null}, discord_username),
      facebook_url = COALESCE(${parsed.data.facebookUrl || null}, facebook_url),
      social_links = COALESCE(${parsed.data.socialLinks ? JSON.stringify(parsed.data.socialLinks) : null}::jsonb, social_links),
      updated_at = NOW()
    WHERE id = ${user.id}
  `;
  await sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (${user.id}, 'account.profile.updated', 'user', ${user.id}, '{}')
  `;
  const updated = await sql`SELECT * FROM users WHERE id = ${user.id}`;
  return c.json({ data: updated[0] });
});

app.get("/api/v1/users/me/settings", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const sql = neon(c.env.DATABASE_URL!);
  const privacy = await sql`SELECT * FROM user_privacy WHERE user_id = ${user.id}`;
  const notifications = await sql`SELECT * FROM notification_preferences WHERE user_id = ${user.id}`;
  return c.json({ data: { privacy: privacy[0] ?? null, notifications: notifications[0] ?? null } });
});

app.patch("/api/v1/users/me/privacy", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const parsed = privacySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid privacy settings.", details: parsed.error.flatten() } }, 400);

  const sql = neon(c.env.DATABASE_URL!);
  await sql`
    INSERT INTO user_privacy (user_id, public_profile, public_region, public_favorite_games, public_social_links)
    VALUES (
      ${user.id},
      ${parsed.data.publicProfile ?? true},
      ${parsed.data.publicRegion ?? true},
      ${parsed.data.publicFavoriteGames ?? true},
      ${parsed.data.publicSocialLinks ?? true}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      public_profile = COALESCE(${parsed.data.publicProfile ?? null}, user_privacy.public_profile),
      public_region = COALESCE(${parsed.data.publicRegion ?? null}, user_privacy.public_region),
      public_favorite_games = COALESCE(${parsed.data.publicFavoriteGames ?? null}, user_privacy.public_favorite_games),
      public_social_links = COALESCE(${parsed.data.publicSocialLinks ?? null}, user_privacy.public_social_links),
      updated_at = NOW()
  `;
  const result = await sql`SELECT * FROM user_privacy WHERE user_id = ${user.id}`;
  return c.json({ data: result[0] });
});

app.patch("/api/v1/users/me/settings", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const schema = z.object({
    communityUpdates: z.boolean().optional(),
    reviewNotifications: z.boolean().optional(),
    eventNotifications: z.boolean().optional(),
    tournamentNotifications: z.boolean().optional(),
    securityNotifications: z.boolean().optional(),
    marketingNotifications: z.boolean().optional()
  }).strict();
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid notification preferences.", details: parsed.error.flatten() } }, 400);
  const sql = neon(c.env.DATABASE_URL!);
  await sql`
    INSERT INTO notification_preferences (
      user_id, community_updates, review_notifications, event_notifications,
      tournament_notifications, security_notifications, marketing_notifications
    ) VALUES (
      ${user.id},
      ${parsed.data.communityUpdates ?? true},
      ${parsed.data.reviewNotifications ?? true},
      ${parsed.data.eventNotifications ?? true},
      ${parsed.data.tournamentNotifications ?? true},
      ${parsed.data.securityNotifications ?? true},
      ${parsed.data.marketingNotifications ?? false}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      community_updates = COALESCE(${parsed.data.communityUpdates ?? null}, notification_preferences.community_updates),
      review_notifications = COALESCE(${parsed.data.reviewNotifications ?? null}, notification_preferences.review_notifications),
      event_notifications = COALESCE(${parsed.data.eventNotifications ?? null}, notification_preferences.event_notifications),
      tournament_notifications = COALESCE(${parsed.data.tournamentNotifications ?? null}, notification_preferences.tournament_notifications),
      security_notifications = COALESCE(${parsed.data.securityNotifications ?? null}, notification_preferences.security_notifications),
      marketing_notifications = COALESCE(${parsed.data.marketingNotifications ?? null}, notification_preferences.marketing_notifications),
      updated_at = NOW()
  `;
  const result = await sql`SELECT * FROM notification_preferences WHERE user_id = ${user.id}`;
  return c.json({ data: result[0] });
});

app.get("/api/v1/users/:username", async (c) => {
  if (!c.env.DATABASE_URL) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const username = c.req.param("username");
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return c.json({ error: { code: "NOT_FOUND", message: "User not found." } }, 404);
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    SELECT u.id, u.username, u.display_name, u.profile_picture_url, u.avatar_url, u.bio,
           u.region, u.country, u.favorite_games, u.discord_username, u.facebook_url,
           u.social_links, u.created_at,
           up.public_profile, up.public_region, up.public_favorite_games, up.public_social_links
    FROM users u
    LEFT JOIN user_privacy up ON up.user_id = u.id
    WHERE lower(u.username) = lower(${username}) AND u.status = 'active'
  `;
  if (!rows.length || rows[0].public_profile === false) {
    return c.json({ error: { code: "NOT_FOUND", message: "User not found." } }, 404);
  }
  const row: any = rows[0];
  const publicProfile: any = {
    username: row.username,
    displayName: row.display_name,
    profilePictureUrl: row.profile_picture_url ?? row.avatar_url,
    bio: row.bio,
    country: row.country,
    createdAt: row.created_at
  };
  if (row.public_region !== false) publicProfile.region = row.region;
  if (row.public_favorite_games !== false) publicProfile.favoriteGames = row.favorite_games;
  if (row.public_social_links !== false) {
    publicProfile.discordUsername = row.discord_username;
    publicProfile.facebookUrl = row.facebook_url;
    publicProfile.socialLinks = row.social_links;
  }
  return c.json({ data: publicProfile });
});

app.post("/api/v1/users/me/delete-request", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const parsed = z.object({ reason: z.string().trim().max(1000).optional() }).strict().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid deletion request.", details: parsed.error.flatten() } }, 400);
  const sql = neon(c.env.DATABASE_URL!);
  await sql`
    INSERT INTO account_deletion_requests (user_id, reason)
    VALUES (${user.id}, ${parsed.data.reason ?? null})
    ON CONFLICT (user_id, status) DO UPDATE SET reason = EXCLUDED.reason, requested_at = NOW()
  `;
  await sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (${user.id}, 'account.deletion.requested', 'user', ${user.id}, '{}')
  `;
  return c.json({ data: { status: "pending" } });
});

app.post("/api/v1/users/me/avatar", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  return c.json({
    error: {
      code: "AVATAR_STORAGE_NOT_CONFIGURED",
      message: "Hosted profile picture storage is not configured."
    }
  }, 503);
});

app.delete("/api/v1/users/me/avatar", async (c) => {
  const { claims, user } = await authenticatedUser(c);
  if (!claims) return c.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, 401);
  if (!user) return c.json({ error: { code: "ACCOUNT_STORAGE_UNAVAILABLE", message: "Account storage is unavailable." } }, 503);
  const sql = neon(c.env.DATABASE_URL!);
  await sql`UPDATE users SET profile_picture_url = NULL, updated_at = NOW() WHERE id = ${user.id}`;
  return c.json({ data: { profilePictureUrl: null } });
});

app.get("/api/v1/communities", async (c) => {
  const parsed = paginationSchema.safeParse({
    page: c.req.query("page"),
    limit: c.req.query("limit")
  });
  if (!parsed.success) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid pagination", details: parsed.error.flatten() } }, 400);
  }
  if (!c.env.DATABASE_URL) {
    return c.json({ error: { code: "DATABASE_NOT_CONFIGURED", message: "Database is not configured for this environment." } }, 503);
  }
  try {
    const sql = neon(c.env.DATABASE_URL);
    const offset = (parsed.data.page - 1) * parsed.data.limit;
    const countRows = await sql`SELECT COUNT(*)::int AS total FROM communities WHERE status = 'approved'`;
    const communities = await sql`
      SELECT id, name, slug, description, logo_url, banner_url, member_count,
             verification_status, featured_status
      FROM communities
      WHERE status = 'approved'
      ORDER BY featured_status DESC, created_at DESC
      LIMIT ${parsed.data.limit} OFFSET ${offset}
    `;
    return c.json({
      data: communities,
      pagination: { ...parsed.data, total: countRows[0]?.total ?? 0 }
    });
  } catch (error) {
    console.error("Community directory query failed", error);
    return c.json({ error: { code: "DATABASE_ERROR", message: "The community directory is temporarily unavailable." } }, 503);
  }
});

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Route not found." } }, 404));
app.onError((err, c) => {
  console.error("Unhandled API error", err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, 500);
});

export default app;
