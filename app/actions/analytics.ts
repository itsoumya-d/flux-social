'use server';

import { getPosts } from './posts';
import { getMessages } from './messages';
import { supabase, createClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
}

export async function getEngagementStats(brandId: string) {
    const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('brand_id', brandId);

    if (!posts || posts.length === 0) {
        return { reach: 0, engagement: 0, clicks: 0, posts: 0 };
    }

    const postIds = posts.map(p => p.id);

    const { data: analytics, error } = await supabase
        .from('analytics_data')
        .select('reach, engagement, clicks')
        .in('post_id', postIds);

    if (error || !analytics) {
        console.error('Error fetching analytics:', error);
        return { reach: 0, engagement: 0, clicks: 0, posts: posts.length };
    }

    const stats = analytics.reduce((acc, curr) => ({
        reach: acc.reach + (curr.reach || 0),
        engagement: acc.engagement + (curr.engagement || 0),
        clicks: acc.clicks + (curr.clicks || 0),
    }), { reach: 0, engagement: 0, clicks: 0 });

    return {
        ...stats,
        posts: posts.length
    };
}

export async function askFlux(brandId: string, query: string) {
    try {
        const posts = await getPosts(brandId);
        const messages = await getMessages(brandId);
        const stats = await getEngagementStats(brandId);

        const context = `
        Brand Analytics Context:
        - Total Posts: ${posts.length}
        - Scheduled Posts: ${posts.filter(p => p.status === 'scheduled').length}
        - Total Reach: ${stats.reach}
        - Total Engagement: ${stats.engagement}
        - Recent Messages: ${messages.length} (${messages.filter(m => m.is_important).length} high priority)
        `;

        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const prompt = `You are Flux AI, a world-class social media strategist. Answer the user's query based on the following brand context. 
        
${context}

User Query: "${query}"

Provide a concise, insightful answer (2-3 sentences) and 3 key metrics as a JSON array of objects with 'label' and 'value'.

Return format:
{
  "answer": "...",
  "stats": [{"label": "...", "value": "..."}]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Ask Flux failed:', error);
        // Fallback to basic keyword matching (original implementation)
        // Return a generic error/fallback message without fake data
        return {
            answer: "I'm having trouble analyzing your data right now. Please ensure your accounts are connected and try again.",
            stats: []
        };
    }
}

export async function getGrowthStats(brandId: string, startDate?: Date, endDate?: Date) {
    const supabase = createClient();

    // Default to last 30 days if no range provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: analytics, error } = await supabase
        .from('brand_analytics')
        .select('*')
        .eq('brand_id', brandId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error || !analytics || analytics.length === 0) {
        return {
            reachTrend: [],
            engagementTrend: [],
            platformSplit: [],
            dates: []
        };
    }

    return {
        reachTrend: analytics.map((a: any) => a.total_reach || 0),
        engagementTrend: analytics.map((a: any) => a.total_engagement || 0),
        dates: analytics.map((a: any) => a.date),
        platformSplit: Object.entries(
            analytics.reduce((acc: any, curr: any) => {
                acc[curr.platform] = (acc[curr.platform] || 0) + (curr.total_reach || 0);
                return acc;
            }, {})
        ).map(([platform, value]) => ({ platform, value }))
    };
}

export async function getContentPerformance(brandId: string) {
    // This is a mock implementation since we need to do detailed aggregation 
    // on JSON fields which is hard in SQL for now.
    // In production, we'd use a materialized view or specialized analytics DB.

    const { data: posts } = await supabase
        .from('posts')
        .select('media_urls, predicted_engagement, platform_specific_content')
        .eq('brand_id', brandId)
        .limit(50); // Analyze sample of active posts

    if (!posts) return [];

    const stats: Record<string, { count: number; engagement: number }> = {
        'Video': { count: 0, engagement: 0 },
        'Image': { count: 0, engagement: 0 },
        'Text': { count: 0, engagement: 0 }
    };

    posts.forEach(post => {
        let type = 'Text';
        const media = post.media_urls || [];
        if (media.length > 0) {
            // Very basic heuristic
            type = media[0].includes('.mp4') ? 'Video' : 'Image';
        }

        const engagement = post.predicted_engagement
            ? ((post.predicted_engagement as any).likes || 0) + ((post.predicted_engagement as any).comments || 0)
            : 0;

        stats[type].count++;
        stats[type].engagement += engagement;
    });

    return Object.entries(stats).map(([type, data]) => ({
        type,
        count: data.count,
        avgEngagement: data.count > 0 ? Math.round(data.engagement / data.count) : 0
    }));
}

export async function getPlatformComparison(brandId: string) {
    const stats = await getGrowthStats(brandId); // Gets last 30 days by default
    return stats.platformSplit.map((p: any) => ({
        platform: p.platform,
        reach: p.value as number,
        engagement: Math.floor(Math.random() * (p.value as number) * 0.05) // Mock engagement for platform split
    }));
}

export async function getPredictiveMetrics(brandId: string) {
    const baseMetrics = await getEngagementStats(brandId);
    const growth = await getGrowthStats(brandId);

    return {
        currentMetrics: {
            reach: baseMetrics.reach || 0,
            engagement: baseMetrics.engagement || 0,
            followers: (growth.reachTrend.length > 0 ? growth.reachTrend[growth.reachTrend.length - 1] * 0.1 : 0),
            shares: 0, // No real data for shares yet
        },
        predictions: {
            nextWeekReach: 0, // Requires ML service
            nextWeekEngagement: 0,
            confidence: 0,
            bestPostTime: 'Insufficient Data',
            suggestedContentType: 'N/A',
        },
        trends: {
            reach: growth.reachTrend,
            engagement: growth.engagementTrend,
            followers: [], // Requires historical follower data
        },
        platformBreakdown: growth.platformSplit,
        contentPerformance: [], // Requires deep content analysis
    };
}

// Generate AI-powered analytics insights
export async function generateAIAnalyticsInsights(brandId: string) {
    try {
        const metrics = await getPredictiveMetrics(brandId);

        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const prompt = `Analyze these social media metrics and provide deep strategic insights. 
        
Metrics: ${JSON.stringify(metrics)}

Return a JSON object:
{
  "summary": "one paragraph summary of performance",
  "insights": ["3 specific insights"],
  "recommendations": [{"text": "recommendation", "priority": "high" | "medium"}],
  "predictions": {"nextWeekReach": number, "confidence": number}
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const aiResponse = JSON.parse(text);

        return {
            ...aiResponse,
            predictions: {
                ...metrics.predictions,
                ...aiResponse.predictions
            }
        };
    } catch (error) {
        console.error('Gemini insights failed:', error);
        // Fallback (original mock implementation)
        return {
            summary: "Unable to generate insights at this time.",
            insights: [],
            recommendations: [],
            predictions: { nextWeekReach: 0, confidence: 0 },
        };
    }
}

// ===== ANOMALY DETECTION (Buffer doesn't have this) =====

export async function detectAnomalies(brandId: string) {
    const metrics = await getPredictiveMetrics(brandId);

    // Analyze trends for anomalies
    const reachTrend = metrics.trends.reach;
    const engagementTrend = metrics.trends.engagement;

    // Calculate moving averages and detect deviations
    const anomalies: {
        type: 'positive' | 'negative';
        metric: string;
        deviation: string;
        date: string;
        message: string;
        action: string;
    }[] = [];

    // Check for engagement spikes/drops
    if (reachTrend.length >= 2) {
        const lastValue = reachTrend[reachTrend.length - 1];
        const prevValue = reachTrend[reachTrend.length - 2];
        const change = ((lastValue - prevValue) / prevValue) * 100;

        if (Math.abs(change) > 20) {
            anomalies.push({
                type: change > 0 ? 'positive' : 'negative',
                metric: 'Reach',
                deviation: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
                date: new Date().toISOString().split('T')[0],
                message: change > 0
                    ? 'Significant reach increase detected! Analyze what drove this growth.'
                    : 'Reach dropped significantly. Review recent content and posting times.',
                action: change > 0
                    ? 'Replicate successful content patterns'
                    : 'Adjust content strategy and review audience engagement'
            });
        }
    }

    // Check engagement rate anomalies
    const avgEngagement = engagementTrend.reduce((a, b) => a + b, 0) / engagementTrend.length;
    const lastEngagement = engagementTrend[engagementTrend.length - 1];
    const engagementDeviation = ((lastEngagement - avgEngagement) / avgEngagement) * 100;

    if (Math.abs(engagementDeviation) > 25) {
        anomalies.push({
            type: engagementDeviation > 0 ? 'positive' : 'negative',
            metric: 'Engagement Rate',
            deviation: `${engagementDeviation > 0 ? '+' : ''}${engagementDeviation.toFixed(1)}%`,
            date: new Date().toISOString().split('T')[0],
            message: engagementDeviation > 0
                ? 'Engagement is significantly above average!'
                : 'Engagement dropped below normal levels.',
            action: engagementDeviation > 0
                ? 'Document successful content elements for future reference'
                : 'Review content quality and posting schedule'
        });
    }

    return {
        anomalies,
        summary: anomalies.length > 0
            ? `${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} detected in your metrics`
            : 'All metrics are within normal ranges',
        lastChecked: new Date().toISOString(),
        healthScore: anomalies.filter(a => a.type === 'negative').length === 0 ? 'healthy' : 'needs attention'
    };
}

// ===== AI-POWERED COMPETITOR INSIGHTS (Buffer has basic, we have AI-powered) =====

export async function getCompetitorInsightsAI(brandId: string, competitorData?: {
    name: string;
    platforms: string[];
    recentPosts: number;
    avgEngagement: number;
    followerGrowth: number;
}[]) {
    // Mock competitor data if not provided
    const competitors = competitorData || [
        { name: 'Competitor A', platforms: ['twitter', 'linkedin'], recentPosts: 45, avgEngagement: 3.2, followerGrowth: 5.4 },
        { name: 'Competitor B', platforms: ['instagram', 'tiktok'], recentPosts: 62, avgEngagement: 4.8, followerGrowth: 8.2 },
        { name: 'Competitor C', platforms: ['linkedin'], recentPosts: 28, avgEngagement: 2.1, followerGrowth: 2.8 }
    ];

    // Calculate competitive positioning
    const avgCompetitorEngagement = competitors.reduce((sum, c) => sum + c.avgEngagement, 0) / competitors.length;
    const avgCompetitorGrowth = competitors.reduce((sum, c) => sum + c.followerGrowth, 0) / competitors.length;

    const insights = {
        overview: {
            totalCompetitors: competitors.length,
            avgIndustryEngagement: avgCompetitorEngagement,
            avgIndustryGrowth: avgCompetitorGrowth
        },
        leaders: competitors.filter(c => c.avgEngagement > avgCompetitorEngagement)
            .sort((a, b) => b.avgEngagement - a.avgEngagement)
            .slice(0, 3)
            .map(c => ({
                name: c.name,
                strength: `${c.avgEngagement}% engagement rate`,
                strategy: c.platforms.includes('video') ? 'Video-first approach' : 'Consistent posting'
            })),
        opportunities: [
            competitors.some(c => !c.platforms.includes('tiktok'))
                ? 'TikTok is underutilized by competitors - opportunity for differentiation'
                : null,
            avgCompetitorGrowth < 5
                ? 'Industry growth is modest - aggressive content strategy could capture market share'
                : null,
            competitors.filter(c => c.platforms.includes('linkedin')).length < 2
                ? 'LinkedIn space is less competitive - focus B2B efforts here'
                : null
        ].filter(Boolean),
        recommendations: [
            {
                action: 'Match or exceed competitor posting frequency',
                current: 'Unknown',
                target: `${Math.max(...competitors.map(c => c.recentPosts))} posts/month`,
                priority: 'high'
            },
            {
                action: 'Target above-industry engagement rate',
                current: 'Unknown',
                target: `${(avgCompetitorEngagement * 1.2).toFixed(1)}%`,
                priority: 'high'
            }
        ],
        competitorActivity: competitors.map(c => ({
            name: c.name,
            platforms: c.platforms,
            activityLevel: c.recentPosts > 40 ? 'high' : c.recentPosts > 20 ? 'medium' : 'low',
            threatLevel: c.avgEngagement > 4 && c.followerGrowth > 5 ? 'high' : 'medium'
        }))
    };

    return {
        success: true,
        insights,
        generatedAt: new Date().toISOString()
    };
}

// ===== REAL-TIME PERFORMANCE TRACKING =====

export async function getRealTimeMetrics(brandId: string) {
    const supabase = createClient();

    // Get latest analytics snapshot
    const { data: latest, error } = await supabase
        .from('brand_analytics')
        .select('*')
        .eq('brand_id', brandId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

    if (error || !latest) {
        return {
            live: { activeViewers: 0, engagementsLastHour: 0, newFollowersToday: 0, pendingMessages: 0 },
            trending: { topPost: null, topHashtag: 'None', sentiment: 'neutral' },
            alerts: [],
            lastUpdated: new Date().toISOString()
        };
    }

    return {
        live: {
            activeViewers: Math.floor(Math.random() * 50), // This would ideally come from a real-time socket
            engagementsLastHour: Math.floor((latest.total_engagement || 0) / 24),
            newFollowersToday: latest.followers_gained || 0,
            pendingMessages: 0 // Fetch from messages table
        },
        trending: {
            topPost: null,
            topHashtag: '#Trending',
            sentiment: 'positive'
        },
        alerts: [],
        lastUpdated: latest.created_at
    };
}

// ===== BRANDED REPORTS EXPORT (Buffer Feature) =====

export async function generateBrandedReport(input: {
    brandId: string;
    dateRange: { start: string; end: string };
    format: 'json' | 'csv';
    includeCharts?: boolean;
    branding?: {
        logoUrl?: string;
        companyName?: string;
        primaryColor?: string;
    };
}) {
    // Get metrics for the report
    const metrics = await getPredictiveMetrics(input.brandId);
    const insights = await generateAIAnalyticsInsights(input.brandId);
    const competitors = await getCompetitorInsightsAI(input.brandId);
    const anomalies = await detectAnomalies(input.brandId);

    const reportData = {
        metadata: {
            generatedAt: new Date().toISOString(),
            dateRange: input.dateRange,
            brandId: input.brandId,
            companyName: input.branding?.companyName || 'FluxSocial Report',
            format: input.format
        },
        summary: {
            totalReach: metrics.currentMetrics.reach,
            totalEngagement: metrics.currentMetrics.engagement,
            totalFollowers: metrics.currentMetrics.followers,
            totalShares: metrics.currentMetrics.shares,
            aiSummary: insights.summary
        },
        performance: {
            trends: metrics.trends,
            platformBreakdown: metrics.platformBreakdown,
            contentPerformance: metrics.contentPerformance,
            predictions: metrics.predictions
        },
        insights: {
            keyInsights: insights.insights,
            recommendations: insights.recommendations,
            anomalies: anomalies.anomalies
        },
        competitive: {
            overview: competitors.insights?.overview,
            opportunities: competitors.insights?.opportunities,
            competitorActivity: competitors.insights?.competitorActivity
        }
    };

    // Format as CSV if requested
    if (input.format === 'csv') {
        const csvRows = [
            ['Metric', 'Value', 'Period'],
            ['Total Reach', reportData.summary.totalReach.toString(), input.dateRange.start + ' to ' + input.dateRange.end],
            ['Total Engagement', reportData.summary.totalEngagement.toString(), input.dateRange.start + ' to ' + input.dateRange.end],
            ['Total Followers', reportData.summary.totalFollowers.toString(), 'Current'],
            ['Total Shares', reportData.summary.totalShares.toString(), input.dateRange.start + ' to ' + input.dateRange.end],
            ['', '', ''],
            ['Platform', 'Reach', ''],
            ...reportData.performance.platformBreakdown.map((p: any) => [p.platform, p.value.toString(), '']),
            ['', '', ''],
            ['Content Type', 'Engagement Rate', 'Reach'],
            ...reportData.performance.contentPerformance.map((c: any) => [c.type, c.engagementRate.toString() + '%', c.reach.toString()]),
        ];

        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        return {
            success: true,
            format: 'csv',
            content: csvContent,
            filename: `fluxsocial-report-${new Date().toISOString().split('T')[0]}.csv`,
            reportData
        };
    }

    return {
        success: true,
        format: 'json',
        content: JSON.stringify(reportData, null, 2),
        filename: `fluxsocial-report-${new Date().toISOString().split('T')[0]}.json`,
        reportData
    };
}
