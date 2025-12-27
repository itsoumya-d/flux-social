'use server';

import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function createCheckoutSession(priceId: string) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        throw new Error('Unauthorized');
    }

    const origin = (await headers()).get('origin') || 'http://localhost:3000';

    // 1. Get or Create Stripe Customer
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('id', userId)
        .single();

    let customerId = profile?.customer_id;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.emailAddresses[0].emailAddress,
            metadata: {
                userId: userId,
            },
        });
        customerId = customer.id;

        await supabase
            .from('profiles')
            .update({ customer_id: customerId })
            .eq('id', userId);
    }

    // 2. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/settings`,
        metadata: {
            userId: userId,
        },
    });

    return { url: session.url };
}
