-- Profiles table to sync with Clerk
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Matches Clerk User ID (passed as UUID)
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  billing_tier TEXT DEFAULT 'free' CHECK (billing_tier IN ('free', 'creator', 'team', 'agency', 'enterprise')),
  is_pro BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 50,
  customer_id TEXT,
  subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands/Workspaces
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  industry TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members for brands
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(brand_id, user_id)
);

-- Social Platforms connected to Brands (expanded platform support)
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'pinterest', 'youtube', 'threads', 'bluesky', 'google_business')),
  profile_id TEXT, -- Platform-specific profile/page ID
  profile_name TEXT,
  profile_avatar TEXT,
  access_token_encrypted TEXT, -- Encrypted OAuth token
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  api_key_ref TEXT, -- Reference to Ayrshare or other service
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Brand Voice profiles for content generation
CREATE TABLE brand_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  tone_formality DECIMAL(3,2) DEFAULT 0.5 CHECK (tone_formality BETWEEN 0 AND 1),
  tone_enthusiasm DECIMAL(3,2) DEFAULT 0.5 CHECK (tone_enthusiasm BETWEEN 0 AND 1),
  tone_humor DECIMAL(3,2) DEFAULT 0.3 CHECK (tone_humor BETWEEN 0 AND 1),
  tone_technicality DECIMAL(3,2) DEFAULT 0.5 CHECK (tone_technicality BETWEEN 0 AND 1),
  key_phrases JSONB DEFAULT '[]',
  avoid_phrases JSONB DEFAULT '[]',
  style_examples JSONB DEFAULT '[]', -- Sample content for training
  embedding_vector VECTOR(1536), -- OpenAI embedding for RAG
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts/Content (enhanced with AI features)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  platform_specific_content JSONB DEFAULT '{}', -- Platform-specific variations
  media_urls JSONB DEFAULT '[]',
  platforms JSONB NOT NULL DEFAULT '[]', -- Array of platform IDs
  hashtags JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'pending_review', 'rejected')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  optimal_time_suggested TIMESTAMPTZ, -- AI-suggested optimal time
  requires_review BOOLEAN DEFAULT false,
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  ai_generated BOOLEAN DEFAULT false,
  brand_voice_id UUID REFERENCES brand_voices(id),
  predicted_engagement JSONB, -- AI prediction: {reach, likes, comments, shares}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-specific post results
CREATE TABLE post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  platform_post_id TEXT, -- Native post ID on the platform
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots (enhanced with more metrics)
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL, -- {impressions, reach, likes, comments, shares, saves, clicks, etc.}
  audience_demographics JSONB, -- Age, gender, location breakdown
  engagement_rate DECIMAL(5,4),
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand-level analytics aggregates
CREATE TABLE brand_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  followers INTEGER,
  followers_gained INTEGER,
  followers_lost INTEGER,
  total_impressions BIGINT,
  total_reach BIGINT,
  total_engagement INTEGER,
  engagement_rate DECIMAL(5,4),
  top_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, date)
);

-- Social Listening: Track brand mentions across platforms
CREATE TABLE social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  source_url TEXT,
  source_post_id TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  author_followers INTEGER,
  content TEXT NOT NULL,
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score DECIMAL(3,2), -- -1 to 1
  is_influencer BOOLEAN DEFAULT false,
  reach_estimate INTEGER,
  requires_response BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  response_post_id UUID REFERENCES posts(id),
  keywords_matched JSONB DEFAULT '[]',
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor tracking
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handles JSONB NOT NULL, -- {twitter: "@handle", instagram: "@handle", etc.}
  website_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor analytics snapshots
CREATE TABLE competitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  followers INTEGER,
  followers_change INTEGER,
  posts_count INTEGER,
  avg_engagement_rate DECIMAL(5,4),
  top_performing_content JSONB, -- Sample of high-performing posts
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_id, platform, date)
);

-- Hashtag performance tracking
CREATE TABLE hashtag_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL,
  times_used INTEGER DEFAULT 0,
  avg_reach INTEGER,
  avg_engagement_rate DECIMAL(5,4),
  trending_score DECIMAL(3,2),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, hashtag, platform)
);

-- Community/Inbox (enhanced with AI features)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_message_id TEXT,
  thread_id TEXT, -- For conversation threading
  sender_id TEXT,
  sender_name TEXT NOT NULL,
  sender_handle TEXT,
  sender_avatar TEXT,
  sender_followers INTEGER,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'comment' CHECK (message_type IN ('comment', 'dm', 'mention', 'reply')),
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score DECIMAL(3,2),
  priority_score INTEGER DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),
  ai_suggested_response TEXT,
  is_important BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  response_content TEXT,
  parent_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled jobs for post publishing
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('post_published', 'post_failed', 'approval_needed', 'mention', 'comment', 'team_invite', 'crisis_alert', 'milestone')),
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for collaboration (enhanced with threads and positioning)
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For threading
  content TEXT NOT NULL,
  mentioned_users JSONB DEFAULT '[]',
  position JSONB DEFAULT NULL, -- {x: 0.5, y: 0.8, media_index: 0} for post-it style
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Workflow definitions for a brand
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  steps JSONB NOT NULL, -- [{role: "admin", min_approvals: 1}, {role: "editor", min_approvals: 1}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking individual approvals in a chain
CREATE TABLE post_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  approver_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'requested_changes', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, step_index, approver_id)
);

-- Content library for reusable assets
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'gif', 'document')),
  file_name TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- For video/audio
  alt_text TEXT,
  tags JSONB DEFAULT '[]',
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for compliance and tracking
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;

-- Helper function to check brand access
CREATE OR REPLACE FUNCTION user_has_brand_access(brand_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brands WHERE id = brand_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM team_members WHERE brand_id = brand_uuid AND user_id = auth.uid() AND accepted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Core RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view brands they have access to" ON brands 
  FOR SELECT USING (user_has_brand_access(id));
CREATE POLICY "Owners can manage their brands" ON brands 
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view team" ON team_members 
  FOR SELECT USING (user_has_brand_access(brand_id));
CREATE POLICY "Admins can manage team" ON team_members 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.brand_id = team_members.brand_id 
            AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
  );

CREATE POLICY "Brand access for platforms" ON platforms 
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for posts" ON posts 
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for messages" ON messages
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for analytics" ON analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = analytics.post_id 
            AND user_has_brand_access(posts.brand_id))
  );

CREATE POLICY "Brand access for social mentions" ON social_mentions
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for competitors" ON competitors
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Users view own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Brand access for content library" ON content_library
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for post comments" ON post_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_comments.post_id 
            AND user_has_brand_access(posts.brand_id))
  );

CREATE POLICY "Brand access for workflows" ON approval_workflows
  FOR ALL USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand access for approvals" ON post_approvals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_approvals.post_id 
            AND user_has_brand_access(posts.brand_id))
  );

-- Indexes for performance
CREATE INDEX idx_posts_brand_status ON posts(brand_id, status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_messages_brand_unread ON messages(brand_id, is_read) WHERE is_read = false;
CREATE INDEX idx_social_mentions_brand_sentiment ON social_mentions(brand_id, sentiment);
CREATE INDEX idx_analytics_post_platform ON analytics(post_id, platform);
CREATE INDEX idx_brand_analytics_date ON brand_analytics(brand_id, date);
CREATE INDEX idx_scheduled_jobs_pending ON scheduled_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

