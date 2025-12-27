import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    switch (event.type) {
        case 'checkout.session.completed':
            const userId = session.metadata?.userId;
            if (userId) {
                // Update profile to PRO
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        is_pro: true,
                        billing_tier: 'creator', // Default tier on upgrade
                        credits: 500, // Bonus credits for subscribing
                        subscription_id: session.subscription as string,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);

                if (error) console.error('Error updating profile on checkout:', error);
            }
            break;

        case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            const { error: deleteError } = await supabase
                .from('profiles')
                .update({
                    is_pro: false,
                    billing_tier: 'free',
                    subscription_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('subscription_id', subscription.id);

            if (deleteError) console.error('Error downgrading profile on cancel:', deleteError);
            break;

        case 'invoice.payment_succeeded':
            // Could handle recurring payments and top-up credits here
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
}
