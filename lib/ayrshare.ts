const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;
const AYRSHARE_API_URL = 'https://app.ayrshare.com/api/post';

export async function publishToAyrshare(postData: {
    post: string;
    platforms: string[];
    mediaUrls?: string[];
    scheduleDate?: string;
}) {
    if (!AYRSHARE_API_KEY) {
        console.warn('AYRSHARE_API_KEY is not set. Skipping actual publish.');
        return { status: 'mocked', id: 'mock-ayrshare-id' };
    }

    const response = await fetch(AYRSHARE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
        },
        body: JSON.stringify({
            post: postData.post,
            platforms: postData.platforms,
            mediaUrls: postData.mediaUrls,
            scheduleDate: postData.scheduleDate,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Ayrshare API Error:', errorData);
        throw new Error(errorData.message || 'Failed to publish via Ayrshare');
    }

    return await response.json();
}
