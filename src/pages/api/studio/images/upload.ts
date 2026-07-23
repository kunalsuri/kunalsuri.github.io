import type { APIRoute } from 'astro';
import { saveStudioImage, sanitizeSlug } from '../../../../utils/studio-fs.ts';

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return new Response(JSON.stringify({ error: 'Dev mode only' }), { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawSlug = (formData.get('slug') as string | null) || 'general';
    const slug = sanitizeSlug(rawSlug) || 'general';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Clean up filename
    const originalName = file.name || 'uploaded-image.png';
    const extMatch = originalName.match(/\.(png|jpe?g|webp|svg|gif)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.png';
    const baseName = originalName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^\w-]/g, '_');
    const finalFilename = `${baseName}_${Date.now().toString().slice(-4)}${ext}`;

    const saveResult = await saveStudioImage(slug, finalFilename, arrayBuffer);

    const markdownSnippet = `![${baseName}](${saveResult.publicUrl})`;

    return new Response(
      JSON.stringify({
        success: true,
        filename: finalFilename,
        publicUrl: saveResult.publicUrl,
        previewUrl: saveResult.previewUrl,
        markdownSnippet,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Atelier Image Upload API] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 });
  }
};
