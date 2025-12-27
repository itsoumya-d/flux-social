'use client';

import {
    MoreVertical,
    Trash2,
    ShieldCheck,
    UserCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { updateMemberRole, removeMember } from '@/app/actions/team-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function MemberActions({ memberId, currentRole }: { memberId: string, currentRole: string }) {
    const router = useRouter();

    const handleUpdateRole = async (newRole: string) => {
        try {
            await updateMemberRole(memberId, newRole);
            toast.success(`Role updated to ${newRole}`);
            router.refresh();
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await removeMember(memberId);
            toast.success('Member removed');
            router.refresh();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-zinc-950/90 border-glass-border backdrop-blur-xl">
                <DropdownMenuItem onClick={() => handleUpdateRole('admin')} className="gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" /> Make Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateRole('editor')} className="gap-2">
                    <UserCircle className="h-4 w-4 text-emerald-400" /> Make Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateRole('viewer')} className="gap-2">
                    <UserCircle className="h-4 w-4 text-zinc-400" /> Make Viewer
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleRemove} className="gap-2 text-rose-400 focus:text-rose-400">
                    <Trash2 className="h-4 w-4" /> Remove Member
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
