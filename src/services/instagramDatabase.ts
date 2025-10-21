/*
 * Instagram Database Schema
 *
 * Run this SQL in your Supabase SQL Editor to set up the collection history table
 *
 * Copy and paste the following SQL commands into your Supabase SQL Editor:
 *
 * CREATE TABLE IF NOT EXISTS collection_history (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     success BOOLEAN NOT NULL,
 *     posts_collected INTEGER NOT NULL DEFAULT 0,
 *     new_posts_added INTEGER NOT NULL DEFAULT 0,
 *     errors TEXT[] DEFAULT '{}',
 *     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * CREATE INDEX IF NOT EXISTS idx_collection_history_timestamp
 * ON collection_history(timestamp);
 *
 * CREATE OR REPLACE VIEW recent_collection_stats AS
 * SELECT
 *     COUNT(*) as total_collections,
 *     COUNT(CASE WHEN success = true THEN 1 END) as successful_collections,
 *     COUNT(CASE WHEN success = false THEN 1 END) as failed_collections,
 *     SUM(posts_collected) as total_posts_collected,
 *     SUM(new_posts_added) as total_new_posts_added,
 *     MAX(timestamp) as last_collection_time
 * FROM collection_history
 * WHERE timestamp >= NOW() - INTERVAL '7 days';
 *
 * GRANT ALL ON collection_history TO authenticated;
 * GRANT ALL ON collection_history TO service_role;
 * GRANT SELECT ON recent_collection_stats TO authenticated;
 * GRANT SELECT ON recent_collection_stats TO service_role;
 */