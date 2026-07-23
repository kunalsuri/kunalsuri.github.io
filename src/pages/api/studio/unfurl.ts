import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return new Response(JSON.stringify({ error: 'Dev mode only' }), { status: 404 });
  }

  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL parameter required' }), { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          title: parsedUrl.hostname,
          description: url,
          url,
          domain: parsedUrl.hostname,
          image: '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = await res.text();

    const getMeta = (property: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
      return match ? match[1] : '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta('og:title') || (titleMatch ? titleMatch[1].trim() : parsedUrl.hostname);
    const description = getMeta('og:description') || getMeta('description') || parsedUrl.hostname;
    const image = getMeta('og:image') || getMeta('twitter:image') || '';

    return new Response(
      JSON.stringify({
        title,
        description,
        url,
        domain: parsedUrl.hostname,
        image,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        title: 'External Link',
        description: '',
        url: '',
        domain: '',
        image: '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
