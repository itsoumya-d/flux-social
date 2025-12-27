import { NextRequest, NextResponse } from 'next/server';
import { exchangeOAuthCode } from '@/app/actions/oauth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const { platform } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
        console.error(`OAuth error for ${platform}:`, error);
        return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(error)}&platform=${platform}&onboarding=true`, request.url)
        );
    }

    // Validate required parameters
    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/?error=missing_params&onboarding=true', request.url)
        );
    }

    // Get the redirect URI (must match what was sent in authorization request)
    const redirectUri = `${request.nextUrl.origin}/api/oauth/${platform}/callback`;

    try {
        // Exchange the code for tokens
        const result = await exchangeOAuthCode(
            platform as any,
            code,
            redirectUri,
            state
        );

        if (!result.success) {
            return NextResponse.redirect(
                new URL(`/?error=${encodeURIComponent(result.error || 'exchange_failed')}&platform=${platform}&onboarding=true`, request.url)
            );
        }

        // Success! Redirect to settings with success message
        return NextResponse.redirect(
            new URL(`/?success=connected&platform=${platform}&onboarding=true`, request.url)
        );
    } catch (error) {
        console.error(`OAuth callback error for ${platform}:`, error);
        return NextResponse.redirect(
            new URL(`/?error=callback_failed&platform=${platform}&onboarding=true`, request.url)
        );
    }
}
