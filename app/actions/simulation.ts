'use server';

import { predictPerformance } from './ai';
import { checkSubscription } from '@/lib/subscription';
import { auth } from '@clerk/nextjs/server';

export async function runSimulation(input: {
    content: string;
    platform: string;
    mediaType?: 'text' | 'image' | 'video';
}) {
    // 1. Gate this feature
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }
    const isPro = await checkSubscription(userId);

    if (!isPro) {
        return {
            success: false,
            error: 'The Growth Simulator is a Pro feature. Please upgrade to access viral predictions.',
            isGated: true
        };
    }

    // 2. Run the AI Prediction
    try {
        const result = await predictPerformance({
            content: input.content,
            platform: input.platform
        });

        if (!result.success || !result.prediction) {
            throw new Error(result.error || 'Failed to generate prediction');
        }

        return {
            success: true,
            prediction: result.prediction,
            isGated: false
        };

    } catch (error) {
        console.error('Simulation error:', error);
        return {
            success: false,
            error: 'Simulation engine failed. Please try again.',
            isGated: false
        };
    }
}
