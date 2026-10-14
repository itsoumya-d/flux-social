import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

// Load the whole production action module. Only TypeScript types are stripped;
// createPost is never extracted or reimplemented here.
const actionUrl = new URL('../app/actions/posts.ts', import.meta.url);
const actionSource = stripTypeScriptTypes(await readFile(actionUrl, 'utf8'), {
    mode: 'strip',
    sourceUrl: actionUrl.href,
});

const basePost = {
    brandId: 'brand-test',
    content: 'A post awaiting the requested workflow.',
    platforms: ['instagram', 'linkedin'],
};
const scheduledAt = '2030-01-02T12:00:00.000Z';

async function loadActions({
    userId = 'author-test',
    insertError = null,
    providerError = null,
    notificationError = null,
    ablyKey = 'inert-test-key',
} = {}) {
    const calls = {
        auth: 0,
        from: [],
        inserts: [],
        select: 0,
        single: 0,
        provider: [],
        ably: [],
        channels: [],
        broadcasts: [],
        profiles: 0,
        notifications: [],
        errors: [],
        order: [],
    };
    let savedPost;
    const query = {
        insert(value) {
            calls.order.push('insert');
            calls.inserts.push(structuredClone(value));
            savedPost = {
                ...structuredClone(value),
                id: 'saved-post-test',
                created_at: '2030-01-01T12:00:00.000Z',
            };
            return query;
        },
        select() {
            calls.order.push('select');
            calls.select += 1;
            return query;
        },
        async single() {
            calls.order.push('single');
            calls.single += 1;
            return { data: insertError ? null : savedPost, error: insertError };
        },
    };

    // No actual SDK, environment, credentials, network or notification transport
    // is loaded. Each test receives a fresh module and isolated inert mocks.
    const mocks = new Map([
        ['@/lib/supabase', {
            supabase: {
                from(table) {
                    assert.equal(table, 'posts');
                    calls.order.push('from');
                    calls.from.push(table);
                    return query;
                },
            },
        }],
        ['@clerk/nextjs/server', {
            auth: async () => {
                calls.order.push('auth');
                calls.auth += 1;
                return { userId };
            },
        }],
        ['@/lib/ayrshare', {
            publishToAyrshare: async (payload) => {
                calls.order.push('provider');
                calls.provider.push(structuredClone(payload));
                if (providerError) throw providerError;
                return { id: 'inert-provider-result' };
            },
        }],
        ['ably', {
            Rest: class {
                constructor(options) {
                    calls.ably.push(structuredClone(options));
                    this.channels = {
                        get(name) {
                            calls.channels.push(name);
                            return {
                                async publish(event, payload) {
                                    calls.order.push('broadcast');
                                    calls.broadcasts.push({ event, payload: structuredClone(payload) });
                                    if (notificationError) throw notificationError;
                                },
                            };
                        },
                    };
                }
            },
        }],
        ['./notifications', {
            createNotification: async (...args) => {
                calls.notifications.push(structuredClone(args));
            },
        }],
        ['./profiles', {
            getAllProfiles: async () => {
                calls.profiles += 1;
                return [{ id: 'author-test' }, { id: 'teammate-test' }];
            },
        }],
    ]);
    const context = createContext({
        process: Object.freeze({ env: Object.freeze({ NEXT_PUBLIC_ABLY_API_KEY: ablyKey }) }),
        console: Object.freeze({ error: (...args) => calls.errors.push(args) }),
    }, { codeGeneration: { strings: false, wasm: false } });
    const actionModule = new SourceTextModule(actionSource, {
        context,
        identifier: actionUrl.href,
        importModuleDynamically(specifier) {
            throw new Error(`Dynamic imports are forbidden in this test: ${specifier}`);
        },
    });
    await actionModule.link((specifier) => {
        assert.ok(mocks.has(specifier), `Unmocked production import: ${specifier}`);
        const exports = mocks.get(specifier);
        return new SyntheticModule(Object.keys(exports), function () {
            for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
        }, { context, identifier: `mock:${specifier}` });
    });
    await actionModule.evaluate();

    return { actions: actionModule.namespace, calls, get savedPost() { return savedPost; } };
}

function assertSaved(harness, result, input, requiresReview) {
    assert.strictEqual(result, harness.savedPost, 'returns the exact saved row');
    assert.equal(harness.calls.auth, 1);
    assert.deepEqual(harness.calls.from, ['posts']);
    assert.equal(harness.calls.select, 1);
    assert.equal(harness.calls.single, 1);
    assert.deepEqual(harness.calls.inserts, [{
        brand_id: input.brandId,
        creator_id: 'author-test',
        content: input.content,
        platforms: input.platforms,
        scheduled_at: input.scheduledAt,
        media_urls: input.mediaUrls || [],
        status: requiresReview ? 'draft' : (input.scheduledAt ? 'scheduled' : 'draft'),
        requires_review: requiresReview,
        first_comment: input.firstComment || null,
        recurring_config: input.recurringConfig || null,
        is_recurring: input.recurringConfig?.enabled || false,
        platform_specific_content: input.platformOverrides || {},
    }]);
    assert.deepEqual(harness.calls.order.slice(0, 5), ['auth', 'from', 'insert', 'select', 'single']);
}

function assertNotified(harness) {
    const { calls, savedPost } = harness;
    assert.deepEqual(calls.ably, [{ key: 'inert-test-key' }]);
    assert.deepEqual(calls.channels, ['notifications']);
    assert.deepEqual(calls.broadcasts, [{
        event: 'post-created',
        payload: {
            id: savedPost.id,
            content: savedPost.content,
            platforms: savedPost.platforms,
            creator_id: 'author-test',
        },
    }]);
    assert.equal(calls.profiles, 1);
    assert.deepEqual(calls.notifications, [[
        'teammate-test',
        'New Post Created',
        `A new post for ${savedPost.platforms.join(', ')} has been drafted by a teammate.`,
        'post',
    ]]);
}

for (const schedule of [scheduledAt, undefined]) {
    test(`review-required ${schedule ? 'scheduled' : 'immediate'} post is saved without provider dispatch`, async () => {
        const harness = await loadActions();
        const input = {
            ...basePost,
            requiresReview: true,
            scheduledAt: schedule,
            mediaUrls: ['https://example.invalid/image.png'],
            firstComment: 'First comment',
            recurringConfig: { enabled: true, frequency: 'weekly', maxOccurrences: 3 },
            platformOverrides: { linkedin: 'LinkedIn-specific copy' },
        };
        const result = await harness.actions.createPost(input);

        assertSaved(harness, result, input, true);
        assertNotified(harness);
        // Count calls rather than relying on a throwing mock: the action catches
        // publisher exceptions, so a thrown exception alone cannot detect dispatch.
        assert.equal(harness.calls.provider.length, 0, 'review-required posts must never reach the publisher');
        assert.deepEqual(harness.calls.errors, []);
    });
}

for (const requiresReview of [false, undefined]) {
    for (const schedule of [scheduledAt, undefined]) {
        test(`review ${requiresReview === false ? 'false' : 'omitted'}, ${schedule ? 'scheduled' : 'immediate'} preserves normal dispatch`, async () => {
            const harness = await loadActions();
            const input = { ...basePost };
            if (requiresReview !== undefined) input.requiresReview = requiresReview;
            if (schedule !== undefined) input.scheduledAt = schedule;
            const result = await harness.actions.createPost(input);

            assertSaved(harness, result, input, false);
            assert.deepEqual(harness.calls.provider, [{
                post: input.content,
                platforms: input.platforms,
                scheduleDate: schedule,
            }]);
            assert.equal(harness.calls.order[5], 'provider', 'dispatch occurs only after persistence');
            assertNotified(harness);
            assert.deepEqual(harness.calls.errors, []);
        });
    }
}

test('non-review dispatch preserves platform overrides and Instagram first comment', async () => {
    const harness = await loadActions();
    const input = {
        ...basePost,
        requiresReview: false,
        scheduledAt,
        firstComment: 'First comment',
        platformOverrides: { linkedin: 'LinkedIn-specific copy' },
    };
    const result = await harness.actions.createPost(input);

    assertSaved(harness, result, input, false);
    assert.deepEqual(harness.calls.provider, [{
        post: input.content,
        platforms: input.platforms,
        scheduleDate: scheduledAt,
        overrides: input.platformOverrides,
        instagramOptions: { firstComment: input.firstComment },
    }]);
    assertNotified(harness);
});

test('non-review dispatch does not add Instagram options to a different platform', async () => {
    const harness = await loadActions();
    const input = { ...basePost, platforms: ['linkedin'], firstComment: 'Saved comment' };
    const result = await harness.actions.createPost(input);

    assertSaved(harness, result, input, false);
    assert.deepEqual(harness.calls.provider, [{
        post: input.content,
        platforms: ['linkedin'],
        scheduleDate: undefined,
    }]);
});

test('insert failure rejects before provider dispatch or notifications', async () => {
    const harness = await loadActions({ insertError: { message: 'Synthetic insert failure' } });
    await assert.rejects(harness.actions.createPost(basePost), /Failed to create post/);

    assert.equal(harness.calls.inserts.length, 1);
    assert.deepEqual(harness.calls.provider, []);
    assert.deepEqual(harness.calls.ably, []);
    assert.equal(harness.calls.profiles, 0);
    assert.deepEqual(harness.calls.notifications, []);
    assert.equal(harness.calls.errors[0][0], 'Error creating post:');
});

test('unauthenticated request rejects without persistence, provider dispatch or notifications', async () => {
    const harness = await loadActions({ userId: null });
    await assert.rejects(harness.actions.createPost(basePost), /Unauthorized/);

    assert.equal(harness.calls.auth, 1);
    assert.deepEqual(harness.calls.from, []);
    assert.deepEqual(harness.calls.inserts, []);
    assert.deepEqual(harness.calls.provider, []);
    assert.deepEqual(harness.calls.ably, []);
    assert.deepEqual(harness.calls.notifications, []);
});

test('non-review provider failure retains the saved row and existing notification behavior', async () => {
    const providerError = new Error('Synthetic publisher failure');
    const harness = await loadActions({ providerError });
    const result = await harness.actions.createPost(basePost);

    assertSaved(harness, result, basePost, false);
    assert.equal(harness.calls.provider.length, 1);
    assertNotified(harness);
    assert.deepEqual(harness.calls.errors, [['Ayrshare scheduling failed:', providerError]]);
});

test('review-required save still returns the saved row if notifications fail', async () => {
    const notificationError = new Error('Synthetic notification failure');
    const harness = await loadActions({ notificationError });
    const input = { ...basePost, requiresReview: true, scheduledAt };
    const result = await harness.actions.createPost(input);

    assertSaved(harness, result, input, true);
    assert.deepEqual(harness.calls.provider, []);
    assert.equal(harness.calls.broadcasts.length, 1);
    assert.equal(harness.calls.profiles, 0);
    assert.deepEqual(harness.calls.errors, [['Notification logic failed:', notificationError]]);
});

test('review-required save stays fail-closed when Ably is not configured', async () => {
    const harness = await loadActions({ ablyKey: '' });
    const input = { ...basePost, requiresReview: true };
    const result = await harness.actions.createPost(input);

    assertSaved(harness, result, input, true);
    assert.deepEqual(harness.calls.provider, []);
    assert.deepEqual(harness.calls.ably, []);
    assert.equal(harness.calls.errors.length, 1);
    assert.equal(harness.calls.errors[0][0], 'Notification logic failed:');
    assert.match(harness.calls.errors[0][1].message, /NEXT_PUBLIC_ABLY_API_KEY/);
});
