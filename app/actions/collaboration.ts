'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type PostComment = {
    id: string;
    post_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    position?: { x: number; y: number; media_index: number };
    is_resolved: boolean;
    created_at: string;
    user?: { full_name: string; avatar_url: string };
};

/**
 * Adds a comment to a post, optionally with threading and spatial positioning.
 */
export async function addPostComment(data: {
    postId: string;
    content: string;
    parentId?: string;
    position?: { x: number; y: number; media_index: number };
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
            post_id: data.postId,
            user_id: userId,
            parent_id: data.parentId,
            content: data.content,
            position: data.position
        })
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    revalidatePath('/calendar');
    revalidatePath('/composer');
    return comment;
}

/**
 * Retrieves threaded comments for a post.
 */
export async function getPostComments(postId: string) {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as PostComment[];
}

/**
 * Resolves a comment thread.
 */
export async function resolveComment(commentId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('post_comments')
        .update({
            is_resolved: true,
            resolved_by: userId,
            resolved_at: new Date().toISOString()
        })
        .eq('id', commentId);

    if (error) throw error;
    revalidatePath('/calendar');
}

/**
 * Records an approval or change request for a post at a specific step.
 */
export async function submitPostApproval(data: {
    postId: string;
    stepIndex: number;
    status: 'approved' | 'requested_changes';
    notes?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('post_approvals')
        .upsert({
            post_id: data.postId,
            step_index: data.stepIndex,
            approver_id: userId,
            status: data.status,
            notes: data.notes,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;

    // Trigger post status update if approved
    if (data.status === 'approved') {
        const { data: workflow } = await supabase
            .from('approval_workflows')
            .select('*')
            .eq('is_default', true) // Simplification for prototype
            .single();

        const { data: approvals } = await supabase
            .from('post_approvals')
            .select('*')
            .eq('post_id', data.postId)
            .eq('status', 'approved');

        // Check if all steps in the chain are satisfying their min_approvals
        if (workflow && approvals) {
            const isAllApproved = workflow.steps.every((step: any, idx: number) => {
                const stepApprovals = approvals.filter(a => a.step_index === idx);
                return stepApprovals.length >= (step.min_approvals || 1);
            });

            if (isAllApproved) {
                await supabase
                    .from('posts')
                    .update({ status: 'scheduled' })
                    .eq('id', data.postId);
            }
        }
    } else if (data.status === 'requested_changes') {
        await supabase
            .from('posts')
            .update({ status: 'rejected' }) // Or 'draft'
            .eq('id', data.postId);
    }

    revalidatePath('/calendar');
    revalidatePath('/team');
}

/**
 * Retrieves approval workflows for a brand.
 */
export async function getBrandWorkflows(brandId: string) {
    const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Saves or updates an approval workflow.
 */
export async function saveApprovalWorkflow(data: {
    id?: string;
    brandId: string;
    name: string;
    steps: { role: string; min_approvals: number }[];
    isDefault?: boolean;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data: workflow, error } = await supabase
        .from('approval_workflows')
        .upsert({
            id: data.id,
            brand_id: data.brandId,
            name: data.name,
            steps: data.steps,
            is_default: data.isDefault,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;

    // If this is set as default, unset others
    if (data.isDefault) {
        await supabase
            .from('approval_workflows')
            .update({ is_default: false })
            .eq('brand_id', data.brandId)
            .neq('id', workflow.id);
    }

    revalidatePath('/team');
    return workflow;
}
