'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addComment } from '@/app/actions/comments';
import { requestChanges, rejectPost } from '@/app/actions/posts';
import { toast } from 'sonner';
import { MessageSquare, AlertCircle, XCircle } from 'lucide-react';

export function PostFeedback({ postId }: { postId: string }) {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSubmit = async (action: 'comment' | 'request_changes' | 'reject' = 'comment') => {
        if (!feedback.trim() && action !== 'reject') return;
        setIsSubmitting(true);
        try {
            if (feedback.trim()) {
                await addComment(postId, feedback);
            }

            if (action === 'request_changes') {
                await requestChanges(postId);
                toast.success('Changes requested');
            } else if (action === 'reject') {
                await rejectPost(postId);
                toast.success('Post rejected');
            } else {
                toast.success('Feedback sent to creator');
            }

            setFeedback('');
            setOpen(false);
        } catch (error) {
            toast.error('Failed to complete action');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] flex-1">
                    Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-glass-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Provide Feedback
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="What should be changed? (e.g. 'Update tone to be more technical', 'Check the image aspect ratio')"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[120px] bg-white/5 border-glass-border focus:border-primary/50"
                    />
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={() => handleSubmit('comment')}
                        disabled={isSubmitting || !feedback.trim()}
                        className="premium-button w-full"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Feedback Only'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit('request_changes')}
                            disabled={isSubmitting || !feedback.trim()}
                            className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 gap-2"
                        >
                            <AlertCircle className="h-4 w-4" /> Request Changes
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit('reject')}
                            disabled={isSubmitting}
                            className="text-red-500 border-red-500/20 hover:bg-red-500/10 gap-2"
                        >
                            <XCircle className="h-4 w-4" /> Reject Post
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
