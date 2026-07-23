import type { APIRoute } from 'astro';
import { saveStudioImage } from '../../../../utils/studio-fs.ts';

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return new Response(JSON.stringify({ error: 'Dev mode only' }), { status: 404 });
  }

  try {
    const body = await request.json();
    const { imageUrl, slug, filename, alt, authorName, authorUrl, provider } = body;

    if (!imageUrl || !slug) {
      return new Response(JSON.stringify({ error: 'imageUrl and slug are required' }), { status: 400 });
    }

    // Fetch image from remote source
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to download image: HTTP ${imgRes.status}` }), { status: 502 });
    }

    const arrayBuffer = await imgRes.arrayBuffer();

    // Determine filename extension or fallback
    const contentType = imgRes.headers.get('content-type') || '';
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('svg')) ext = '.svg';

    const safeBaseName = (filename || 'cover-photo').toLowerCase().replace(/[^\w-]/g, '_');
    const finalFilename = safeBaseName.endsWith(ext) ? safeBaseName : `${safeBaseName}${ext}`;

    const saveResult = await saveStudioImage(slug, finalFilename, arrayBuffer);

    // Format attribution text
    const cleanAuthor = authorName || 'Photographer';
    const cleanAuthorUrl = authorUrl || '#';
    const providerName = provider === 'pexels' ? 'Pexels' : 'Unsplash';
    const providerUrl = provider === 'pexels' ? 'https://pexels.com' : 'https://unsplash.com';

    const attributionText = `*Photo by [${cleanAuthor}](${cleanAuthorUrl}) on [${providerName}](${providerUrl})*`;
    const markdownSnippet = `![${alt || 'Cover Photo'}](${saveResult.publicUrl})\n${attributionText}`;

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: saveResult.publicUrl,
        previewUrl: saveResult.previewUrl,
        attributionText,
        markdownSnippet,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Atelier Image Downloader] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to download and save image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
