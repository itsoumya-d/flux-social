export class LinkedInService {
    private accessToken: string;
    private baseUrl = 'https://api.linkedin.com/v2';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.accessToken}`,
                'cache-control': 'no-cache',
                'X-Restli-Protocol-Version': '2.0.0'
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[LinkedInService] API Error ${endpoint}:`, error);
            throw new Error(`LinkedIn API Error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get basic profile info
     * GET /me
     */
    async getProfile() {
        return this.request('/me');
    }

    /**
     * Get follower count
     * Note: This usually requires specific permissions (r_organization_social or similar for pages)
     * For personal profiles, basic API is limited.
     */
    async getFollowerCount() {
        try {
            // For personal profiles, LinkedIn doesn't easily expose "followers" via basic r_liteprofile.
            // This is a common pain point. We return 0 or placeholder if not accessible.
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get member's shared content
     * GET /ugcPosts?q=authors&authors=List(urn:li:person:...)
     */
    async getRecentContent(limit = 10) {
        try {
            const profile = await this.getProfile();
            const personUrn = `urn:li:person:${profile.id}`;

            // Note: ugcPosts is being replaced by /posts in newer versions
            const data = await this.request(`/ugcPosts?q=authors&authors=List(${encodeURIComponent(personUrn)})&count=${limit}`);

            return (data.elements || []).map((post: any) => ({
                id: post.id,
                content: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
                publishedAt: new Date(post.firstPublishedAt).toISOString(),
                metrics: {
                    likes: 0, // Metrics require a separate call to Social Action API
                    shares: 0,
                    comments: 0
                }
            }));
        } catch (error) {
            console.error('[LinkedInService] Failed to fetch content:', error);
            return [];
        }
    }

    /**
     * Get mentions for the user
     * Individual profiles don't easily expose mentions.
     */
    async getMentions(limit = 10) {
        return [];
    }

    /**
     * Standardized metrics mapping
     */
    calculateAggregatedMetrics(profile: any, followers: number) {
        return {
            reach: followers * 2.1, // LinkedIn has high organic reach multipliers
            engagement: 0,
            impressions: followers * 1.2,
            followers: followers
        };
    }
}
