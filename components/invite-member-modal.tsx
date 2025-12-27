'use client';

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { inviteTeamMember } from '@/app/actions/team-actions';
import { toast } from 'sonner';

export function InviteMemberModal({ brandId }: { brandId: string }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleInvite = async () => {
        if (!email) return;
        setIsLoading(true);
        try {
            await inviteTeamMember(brandId, email, role);
            toast.success('Invitation sent!');
            setOpen(false);
            setEmail('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="premium-button gap-2 shadow-xl shadow-primary/20">
                    <UserPlus className="h-4 w-4" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] premium-card border-glass-border bg-zinc-950/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Enter the email of the person you want to invite to this brand workspace.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white/5 border-glass-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="bg-white/5 border-glass-border">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-glass-border">
                                <SelectItem value="admin">Admin (Full Control)</SelectItem>
                                <SelectItem value="editor">Editor (Can post)</SelectItem>
                                <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleInvite}
                        disabled={isLoading}
                        className="premium-button w-full"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send Invitation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
