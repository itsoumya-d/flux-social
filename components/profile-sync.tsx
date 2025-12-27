'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { syncProfile } from '@/lib/profile';
import { ensureDefaultBrand } from '@/app/actions/brands';
import { seedMessages } from '@/app/actions/messages';

export function ProfileSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            syncProfile(user).then(async () => {
                const brand = await ensureDefaultBrand();
                if (brand) {
                    await seedMessages(brand.id);
                }
            });
        }
    }, [isLoaded, user]);

    return null;
}
