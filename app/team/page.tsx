export const dynamic = 'force-dynamic';
import {
    Users,
    UserPlus,
    Shield,
    Zap,
    Mail,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getActiveBrandId } from '@/app/actions/workspace';
import { getBrandTeam, getUserRole } from '@/app/actions/profiles';
import { InviteMemberModal } from '@/components/invite-member-modal';
import { MemberActions } from '@/components/member-actions';
import { ApprovalWorkflowManager } from '@/components/team/approval-workflow-manager';

export default async function TeamPage() {
    const brandId = await getActiveBrandId();

    if (!brandId) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground opacity-20" />
                <h2 className="text-2xl font-bold">No Brand Selected</h2>
                <p className="text-muted-foreground max-w-xs">Select a brand from the sidebar to manage its team and permissions.</p>
            </div>
        );
    }

    const [members, userRole] = await Promise.all([
        getBrandTeam(brandId),
        getUserRole(brandId)
    ]);

    const canManageTeam = ['owner', 'admin'].includes(userRole);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground text-sm">Control access and collaborate in real-time for this brand.</p>
                </div>
                {canManageTeam && <InviteMemberModal brandId={brandId} />}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="premium-card p-6 bg-white/5 text-center flex flex-col items-center">
                    <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">{members.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Members</div>
                </div>
                <div className="premium-card p-6 bg-white/5 text-center flex flex-col items-center">
                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold">{members.filter(m => m.status === 'Active').length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Now</div>
                </div>
                <div className="premium-card p-6 bg-white/5 text-center flex flex-col items-center">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-4">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400 uppercase text-xs">{userRole}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Your Role</div>
                </div>
            </div>

            <div className="premium-card bg-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-glass-border bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Member</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Role</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                            {canManageTeam && <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                        {members.map((member, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.image} />
                                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-bold">{member.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold border-glass-border uppercase tracking-widest",
                                        member.role === 'owner' && "border-amber-500/50 text-amber-400",
                                        member.role === 'admin' && "border-indigo-500/50 text-indigo-400"
                                    )}>
                                        {member.role}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            member.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'
                                        )} />
                                        <span className="text-sm">{member.status}</span>
                                    </div>
                                </td>
                                {canManageTeam && member.role !== 'owner' && (
                                    <td className="px-6 py-4 text-right">
                                        <MemberActions memberId={member.id} currentRole={member.role} />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {canManageTeam && (
                <div className="pt-8 border-t border-glass-border">
                    <ApprovalWorkflowManager brandId={brandId} />
                </div>
            )}
        </div>
    );
}
