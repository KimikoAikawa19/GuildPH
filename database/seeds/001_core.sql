INSERT INTO roles (name, description, is_system_role) VALUES
  ('OWNER', 'Protected platform owner', TRUE),
  ('ADMIN', 'Platform staff administrator', TRUE),
  ('COMMUNITY_OWNER', 'Owner of one or more communities', TRUE),
  ('USER', 'Standard platform user', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (permission_key, description) VALUES
  ('users.view', 'View user accounts'),
  ('users.suspend', 'Suspend user accounts'),
  ('users.ban', 'Ban user accounts'),
  ('communities.view', 'View communities'),
  ('communities.approve', 'Approve community submissions'),
  ('communities.reject', 'Reject community submissions'),
  ('communities.suspend', 'Suspend communities'),
  ('communities.verify', 'Verify communities'),
  ('reports.view', 'View reports'),
  ('reports.resolve', 'Resolve reports'),
  ('reviews.moderate', 'Moderate reviews'),
  ('events.moderate', 'Moderate events'),
  ('tournaments.moderate', 'Moderate tournaments'),
  ('support.manage', 'Manage support tickets')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO categories (name, slug, description) VALUES
  ('Casual Gaming', 'casual-gaming', 'Relaxed social gaming communities'),
  ('Competitive Gaming', 'competitive-gaming', 'Competitive and ranked communities'),
  ('Esports Organizations', 'esports-organizations', 'Organized esports teams and organizations'),
  ('Minecraft Servers', 'minecraft-servers', 'Minecraft servers and SMP communities'),
  ('Roblox Groups', 'roblox-groups', 'Roblox groups and development teams'),
  ('Mobile Gaming', 'mobile-gaming', 'Mobile games and communities'),
  ('PC Gaming', 'pc-gaming', 'PC gaming communities'),
  ('Console Gaming', 'console-gaming', 'Console gaming communities'),
  ('Gaming Guilds', 'gaming-guilds', 'Guild and clan communities'),
  ('Social Communities', 'social-communities', 'General gaming social communities'),
  ('Game Development Communities', 'game-development', 'Game development groups'),
  ('Content Creator Communities', 'content-creators', 'Gaming content creator communities')
ON CONFLICT (slug) DO NOTHING;
