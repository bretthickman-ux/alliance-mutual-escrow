/* Cloudflare Pages Function: GET /api/reviews
   Serves cached Google Places reviews. The client never talks to Google, and
   nothing is ever hardcoded (HANDOFF hard rule). Flow:

   - If the REVIEWS KV namespace has a fresh cache entry, serve it.
   - If the cache is stale/empty AND GOOGLE_PLACES_KEY + GOOGLE_PLACE_ID are set,
     fetch from the Places API, cache to KV for 6 hours, serve.
   - With no credentials and no cache: serve an empty list. The home page section
     renders nothing in that case.

   To activate (HANDOFF section 8, item 5): set GOOGLE_PLACES_KEY and
   GOOGLE_PLACE_ID in the Pages project env, and bind a KV namespace as REVIEWS. */

interface ReviewOut {
  author: string;
  rating: number;
  text: string;
  time: string;
}

interface CachePayload {
  fetchedAt: number;
  rating: number | null;
  count: number | null;
  reviews: ReviewOut[];
}

const TTL_MS = 6 * 60 * 60 * 1000;
const KV_KEY = 'google-reviews-v1';

export const onRequestGet: PagesFunction<{
  REVIEWS?: KVNamespace;
  GOOGLE_PLACES_KEY?: string;
  GOOGLE_PLACE_ID?: string;
}> = async (context) => {
  const { env } = context;
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
    });

  const empty: CachePayload = { fetchedAt: 0, rating: null, count: null, reviews: [] };

  let cached: CachePayload | null = null;
  if (env.REVIEWS) {
    cached = await env.REVIEWS.get<CachePayload>(KV_KEY, 'json');
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return json(cached);
  }

  if (!env.GOOGLE_PLACES_KEY || !env.GOOGLE_PLACE_ID) {
    // Not configured yet: serve the stale cache if one exists, else empty.
    return json(cached ?? empty);
  }

  try {
    const url = new URL('https://places.googleapis.com/v1/places/' + env.GOOGLE_PLACE_ID);
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
      },
    });
    if (!res.ok) throw new Error('Places API ' + res.status);
    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      reviews?: { authorAttribution?: { displayName?: string }; rating?: number; text?: { text?: string }; publishTime?: string }[];
    };
    const payload: CachePayload = {
      fetchedAt: Date.now(),
      rating: data.rating ?? null,
      count: data.userRatingCount ?? null,
      reviews: (data.reviews ?? [])
        .filter((r) => (r.rating ?? 0) >= 4 && r.text?.text)
        .slice(0, 6)
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? 'Google user',
          rating: r.rating ?? 5,
          text: (r.text?.text ?? '').slice(0, 360),
          time: r.publishTime ?? '',
        })),
    };
    if (env.REVIEWS) await env.REVIEWS.put(KV_KEY, JSON.stringify(payload));
    return json(payload);
  } catch {
    // Google unreachable: stale cache beats nothing, nothing beats an error.
    return json(cached ?? empty);
  }
};
