import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getAllStudioPosts,
  getStudioPostBySlug,
  saveStudioPost,
  saveStudioImage,
  deleteStudioPost,
} from '../../src/utils/studio-fs.ts';

const TEST_SLUG = 'test-folder-post-1234';
const TEST_SLUG_RENAMED = 'test-folder-post-1234-renamed';

describe('Atelier Studio FS Folder Operations', () => {
  afterEach(async () => {
    // Cleanup test post if created
    await deleteStudioPost(TEST_SLUG);
    await deleteStudioPost(TEST_SLUG_RENAMED);
  });

  it('should save a post in folder format under src/content/blog/<slug>/index.md', async () => {
    const frontmatter = {
      title: 'Folder Test Post',
      description: 'Testing folder-based post storage',
      pubDate: '2026-07-22',
      category: 'Engineering',
      tags: ['Test'],
      draft: true,
    };
    const content = '# Folder Test Post Body';

    const result = await saveStudioPost(TEST_SLUG, frontmatter, content);

    expect(result.success).toBe(true);
    expect(result.slug).toBe(TEST_SLUG);
    expect(result.filename).toBe(`${TEST_SLUG}/index.md`);

    const savedPost = await getStudioPostBySlug(TEST_SLUG);
    expect(savedPost).not.toBeNull();
    expect(savedPost?.slug).toBe(TEST_SLUG);
    expect(savedPost?.frontmatter.title).toBe('Folder Test Post');
    expect(savedPost?.content.trim()).toBe('# Folder Test Post Body');
    expect(savedPost?.isFolder).toBe(true);
  });

  it('should save a co-located image in src/content/blog/<slug>/<filename>', async () => {
    // Save initial post
    await saveStudioPost(TEST_SLUG, { title: 'Folder Image Test' }, 'Test content');

    // Create dummy image buffer
    const dummyBuffer = Buffer.from('fake image binary content');

    const imageResult = await saveStudioImage(TEST_SLUG, 'hero.png', dummyBuffer.buffer);

    expect(imageResult.success).toBe(true);
    expect(imageResult.relativeUrl).toBe('./hero.png');
    expect(imageResult.previewUrl).toBe(`/api/studio/assets/${TEST_SLUG}/hero.png`);

    // Verify image file exists on disk
    const imagePath = path.resolve(process.cwd(), `src/content/blog/${TEST_SLUG}/hero.png`);
    const fileExists = await fs
      .access(imagePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should include folder posts in getAllStudioPosts()', async () => {
    await saveStudioPost(TEST_SLUG, { title: 'List Test Post', pubDate: '2026-07-22' }, 'Body');

    const posts = await getAllStudioPosts();
    const found = posts.find((p) => p.slug === TEST_SLUG);

    expect(found).toBeDefined();
    expect(found?.slug).toBe(TEST_SLUG);
    expect(found?.isFolder).toBe(true);
  });

  it('should preserve co-located images when the slug changes on save', async () => {
    await saveStudioPost(TEST_SLUG, { title: 'Rename Test' }, 'Body');
    const dummyBuffer = Buffer.from('fake image binary content');
    await saveStudioImage(TEST_SLUG, 'hero.png', dummyBuffer.buffer);

    const result = await saveStudioPost(TEST_SLUG_RENAMED, { title: 'Rename Test' }, 'Body', TEST_SLUG);
    expect(result.success).toBe(true);
    expect(result.slug).toBe(TEST_SLUG_RENAMED);

    const imagePath = path.resolve(process.cwd(), `src/content/blog/${TEST_SLUG_RENAMED}/hero.png`);
    const imageMovedWithIt = await fs
      .access(imagePath)
      .then(() => true)
      .catch(() => false);
    expect(imageMovedWithIt).toBe(true);

    const oldFolderGone = await getStudioPostBySlug(TEST_SLUG);
    expect(oldFolderGone).toBeNull();
  });

  it('should clean up the post directory when deleted', async () => {
    await saveStudioPost(TEST_SLUG, { title: 'Delete Test' }, 'Body');
    const dummyBuffer = Buffer.from('image');
    await saveStudioImage(TEST_SLUG, 'test.png', dummyBuffer.buffer);

    const deleted = await deleteStudioPost(TEST_SLUG);
    expect(deleted).toBe(true);

    const postAfterDelete = await getStudioPostBySlug(TEST_SLUG);
    expect(postAfterDelete).toBeNull();
  });
});
