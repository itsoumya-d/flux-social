export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  Plus
} from "lucide-react";
import Link from "next/link";
import { getPosts } from "@/app/actions/posts";
import { ensureDefaultBrand } from "@/app/actions/brands";
import { getAIStrategy } from "@/app/actions/ai";
import { getEngagementStats } from "@/app/actions/analytics";
import { ApproveButton } from "@/components/approve-button";
import { PostFeedback } from "@/components/post-feedback";
import { seedMessages } from "@/app/actions/messages";
import { TeamPresence } from "@/components/team-presence";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { LiveStatsGrid } from "@/components/dashboard/live-stats-grid";


export default async function Home() {
  const brand = await ensureDefaultBrand();
  const brandId = brand?.id;
  if (brandId) await seedMessages(brandId);

  const posts = brandId ? await getPosts(brandId) : [];
  const strategies = brandId ? await getAIStrategy(brandId) : [];
  const engagementStats = brandId ? await getEngagementStats(brandId) : { reach: 0, engagement: 0, clicks: 0, posts: 0 };
  const topStrategy = strategies[0];
  const pendingReview = posts.filter(p => p.requires_review && p.status === 'draft');
  const actionRequired = posts.filter(p => p.status === 'needs_changes');

  return (
    <div className="space-y-6 p-8">
      {/* Analytics Overview */}
      <LiveStatsGrid initialStats={engagementStats} brandId={brandId || ''} />

      {/* Approval Queue (Reviewers) */}
      {pendingReview.length > 0 && (
        <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-semibold">Approval Queue</h2>
            </div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-none">{pendingReview.length} Pending</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingReview.map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex gap-2">
                  {post.platforms.map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-[9px] uppercase">{p}</Badge>
                  ))}
                </div>
                <p className="text-xs line-clamp-2 text-muted-foreground">{post.content}</p>
                <div className="pt-2 flex gap-2">
                  <ApproveButton postId={post.id} />
                  <PostFeedback postId={post.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Required (Creators) */}
      {actionRequired.length > 0 && (
        <div className="premium-card p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-semibold text-amber-500">Action Required</h2>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-none">{actionRequired.length} Re-edits</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actionRequired.map((post) => (
              <div key={post.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex gap-2">
                  {post.platforms.map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-[9px] uppercase">{p}</Badge>
                  ))}
                </div>
                <p className="text-xs line-clamp-2 text-muted-foreground">{post.content}</p>
                <div className="pt-2">
                  <Link href={`/composer?id=${post.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-amber-500 border-amber-500/20 hover:bg-amber-500/10">
                      View Feedback & Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Activity */}
        <div className="premium-card md:col-span-4 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Live Feed</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">View All</Button>
          </div>
          <div className="space-y-6">
            {posts.length > 0 ? posts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{post.platforms.join(', ')} post scheduled for <span className="text-primary font-semibold underline decoration-2 underline-offset-4">{new Date(post.scheduled_at).toLocaleString()}</span></p>
                  <p className="text-xs text-muted-foreground">{post.content.slice(0, 100)}...</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {new Date(post.created_at).toLocaleTimeString()}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground italic">No scheduled posts found for this brand.</p>
            )}
          </div>
        </div>

        {/* Team Presence */}
        <div className="premium-card md:col-span-3 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Active Team</h2>
            <Link href="/team">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">Manage</Button>
            </Link>
          </div>
          <TeamPresence />
        </div>
      </div>
    </div>
  );
}
