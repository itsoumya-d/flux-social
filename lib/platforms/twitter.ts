import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
    private client: TwitterApi;

    constructor(accessToken: string) {
        this.client = new TwitterApi(accessToken);
    }

    /**
     * Fetch profile stats for the authenticated user
     * Uses GET /2/users/me
     */
    async getProfileStats() {
        try {
            const me = await this.client.v2.me({
                "user.fields": ["public_metrics", "profile_image_url"]
            });

            if (me.errors) {
                console.error('[TwitterService] Error fetching profile:', me.errors);
                throw new Error('Twitter API Error');
            }

            const metrics = me.data.public_metrics;

            return {
                followers: metrics?.followers_count || 0,
                following: metrics?.following_count || 0,
                tweets: metrics?.tweet_count || 0,
                username: me.data.username,
                avatar: me.data.profile_image_url
            };
        } catch (error) {
            console.error('[TwitterService] Exception in getProfileStats:', error);
            throw error;
        }
    }

    /**
     * Fetch recent tweets for the user
     * Uses GET /2/users/:id/tweets
     */
    async getRecentContent(limit = 10) {
        try {
            const me = await this.client.v2.me();
            const timeline = await this.client.v2.userTimeline(me.data.id, {
                max_results: limit,
                "tweet.fields": ["public_metrics", "created_at", "text"]
            });

            return timeline.data.data.map(tweet => ({
                id: tweet.id,
                content: tweet.text,
                publishedAt: tweet.created_at || new Date().toISOString(),
                metrics: {
                    likes: tweet.public_metrics?.like_count || 0,
                    shares: tweet.public_metrics?.retweet_count || 0,
                    comments: tweet.public_metrics?.reply_count || 0
                }
            }));
        } catch (error) {
            console.error('[TwitterService] Exception in getRecentContent:', error);
            return [];
        }
    }

    /**
     * Fetch mentions for the user
     * Uses GET /2/users/:id/mentions
     */
    async getMentions(limit = 10) {
        try {
            const me = await this.client.v2.me();
            const res = await this.client.v2.userMentionTimeline(me.data.id, {
                max_results: limit,
                "tweet.fields": ["created_at", "text", "author_id"],
                "expansions": ["author_id"],
                "user.fields": ["username", "name"]
            });

            const users = res.includes?.users || [];

            return (res.data.data || []).map((tweet: any) => {
                const author = users.find((u: any) => u.id === tweet.author_id);
                return {
                    id: tweet.id,
                    content: tweet.text,
                    author_name: author?.name || 'Anonymous',
                    author_handle: author?.username || 'unknown',
                    publishedAt: tweet.created_at || new Date().toISOString()
                };
            });
        } catch (error) {
            console.error('[TwitterService] Exception in getMentions:', error);
            return [];
        }
    }

    /**
     * Suggest reach and engagement based on public metrics (placeholder for complex logic)
     */
    calculateAggregatedMetrics(profileStats: any) {
        // Twitter doesn't provide "reach" (impressions) directly via simple OAuth2 user tokens easily
        // Usually requires "ads.read" or similar, but we can estimate or use a multiplier
        return {
            reach: profileStats.followers * 1.5, // Estimated reach
            engagement: (profileStats.tweets > 0) ? (profileStats.followers / profileStats.tweets) : 0,
            impressions: profileStats.followers * 0.8,
            followers: profileStats.followers
        };
    }
}
