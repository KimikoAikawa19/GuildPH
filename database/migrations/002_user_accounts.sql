ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_games JSONB NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_preferences JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

CREATE TABLE IF NOT EXISTS user_privacy (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_profile BOOLEAN NOT NULL DEFAULT TRUE,
  public_region BOOLEAN NOT NULL DEFAULT TRUE,
  public_favorite_games BOOLEAN NOT NULL DEFAULT TRUE,
  public_social_links BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  community_updates BOOLEAN NOT NULL DEFAULT TRUE,
  review_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  event_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  tournament_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  security_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, status)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS account_deletion_status_idx ON account_deletion_requests(status, requested_at);
