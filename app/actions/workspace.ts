'use server';

import { cookies } from 'next/headers';

export async function setActiveBrandId(brandId: string) {
    (await cookies()).set('active_brand_id', brandId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'lax',
    });
}

export async function getActiveBrandId() {
    return (await cookies()).get('active_brand_id')?.value;
}
