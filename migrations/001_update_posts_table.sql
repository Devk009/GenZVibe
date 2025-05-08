-- Add new columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_path TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Drop old column if it exists
ALTER TABLE posts DROP COLUMN IF EXISTS type;
ALTER TABLE posts DROP COLUMN IF EXISTS media_url;