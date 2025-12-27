'use client';

import { Button } from "@/components/ui/button";
import { approvePost } from "@/app/actions/posts";
import { toast } from "sonner";
import { useState } from "react";

export function ApproveButton({ postId }: { postId: string }) {
    const [isApproving, setIsApproving] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await approvePost(postId);
            toast.success('Post approved and scheduled!');
            // In a real app, we'd use router.refresh() or a state update
            window.location.reload();
        } catch (error) {
            toast.error('Failed to approve post');
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            disabled={isApproving}
            onClick={handleApprove}
            className="h-8 text-[10px] flex-1 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20"
        >
            {isApproving ? 'Approving...' : 'Approve'}
        </Button>
    );
}
