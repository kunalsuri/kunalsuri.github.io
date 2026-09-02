#!/usr/bin/env python3
"""
publish_draft.py — Publish blog drafts from docs/drafts/ into src/content/blog/

Features:
- Moves/copies entire draft folders (including images, diagrams, and assets).
- Renames the primary markdown post to index.md under src/content/blog/<slug>/.
- Updates frontmatter `draft: false` (or keeps draft status if --keep-draft is set).
- Optionally updates `pubDate` to today or a custom date.
- Interactive picker when run with no arguments, or accepts slug/fuzzy names.
- Zero third-party Python dependencies (runs on standard Python 3.8+).

Part of the publish-draft Agent Skill (Agent Skills Open Standard).
"""

import argparse
from dataclasses import dataclass
from datetime import date, datetime
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from typing import Dict, List, Optional, Tuple

# Reconfigure stdout/stderr to UTF-8 on Windows consoles to prevent cp1252 encode errors
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# ANSI Color helpers
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if not hasattr(sys.stdout, "isatty") or not sys.stdout.isatty():
        return False
    return True


USE_COLOR = supports_color()


def color(text: str, c: str) -> str:
    if not USE_COLOR:
        return text
    return f"{c}{text}{Colors.RESET}"


def slugify(text: str) -> str:
    """Normalize text into a URL-safe lowercase slug (matching Astro & Vitest rules)."""
    text = text.lower().strip()
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"[^\w-]", "", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def find_repo_root() -> Path:
    """Find the root of the repository starting from current working directory or script location."""
    candidates = [
        Path.cwd(),
        Path(__file__).resolve().parent,
        Path(__file__).resolve().parent.parent,
        Path(__file__).resolve().parent.parent.parent.parent,
        Path(__file__).resolve().parent.parent.parent.parent.parent,
    ]
    for start in candidates:
        cur = start
        while cur != cur.parent:
            if (cur / "astro.config.mjs").exists() or (cur / "package.json").exists():
                return cur
            cur = cur.parent
    return Path.cwd()


@dataclass
class DraftInfo:
    slug: str
    folder_path: Path
    primary_file: Path
    title: str
    pub_date: Optional[str]
    is_draft: bool
    category: str
    tags: List[str]
    asset_files: List[Path]


def parse_frontmatter(content: str) -> Tuple[Dict[str, str], str]:
    """Extract frontmatter and body from a markdown document."""
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$", content.lstrip("\ufeff"))
    if not match:
        return {}, content

    raw_fm = match.group(1)
    body = match.group(2)
    fm_dict: Dict[str, str] = {}

    for line in raw_fm.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            fm_dict[key] = val

    return fm_dict, body


def update_frontmatter_text(
    content: str,
    set_draft: Optional[bool] = None,
    new_pub_date: Optional[str] = None,
) -> str:
    """Update draft status and/or pubDate in the raw markdown text while preserving formatting."""
    content_clean = content.lstrip("\ufeff")
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$", content_clean)
    if not match:
        fm_lines = ["---"]
        if set_draft is not None:
            fm_lines.append(f"draft: {'true' if set_draft else 'false'}")
        if new_pub_date:
            fm_lines.append(f"pubDate: {new_pub_date}")
        fm_lines.append("---")
        return "\n".join(fm_lines) + "\n\n" + content_clean

    raw_fm = match.group(1)
    body = match.group(2)
    lines = raw_fm.splitlines()

    has_draft_key = False
    has_pub_date_key = False
    new_fm_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("draft:"):
            has_draft_key = True
            if set_draft is not None:
                new_fm_lines.append(f"draft: {'true' if set_draft else 'false'}")
            else:
                new_fm_lines.append(line)
        elif stripped.startswith("pubDate:") or stripped.startswith("pub_date:"):
            has_pub_date_key = True
            if new_pub_date:
                new_fm_lines.append(f"pubDate: {new_pub_date}")
            else:
                new_fm_lines.append(line)
        else:
            new_fm_lines.append(line)

    if set_draft is not None and not has_draft_key:
        new_fm_lines.append(f"draft: {'true' if set_draft else 'false'}")

    if new_pub_date and not has_pub_date_key:
        new_fm_lines.append(f"pubDate: {new_pub_date}")

    return f"---\n" + "\n".join(new_fm_lines) + f"\n---\n{body}"


def find_drafts(drafts_dir: Path) -> List[DraftInfo]:
    """Scan the drafts directory and return list of all discovered drafts."""
    if not drafts_dir.exists():
        return []

    drafts: List[DraftInfo] = []

    for item in sorted(drafts_dir.iterdir()):
        if item.name.startswith(".") or item.name == "README.md":
            continue

        if item.is_dir():
            slug = item.name
            all_files = [f for f in item.iterdir() if f.is_file() and not f.name.startswith(".")]

            primary: Optional[Path] = None
            for cand_name in ["index.md", "index.mdx", f"{slug}.md", f"{slug}.mdx"]:
                cand = item / cand_name
                if cand.exists():
                    primary = cand
                    break

            if not primary:
                md_files = [f for f in all_files if f.suffix.lower() in [".md", ".mdx"]]
                if md_files:
                    primary = md_files[0]

            if primary:
                try:
                    content = primary.read_text(encoding="utf-8")
                    fm, _ = parse_frontmatter(content)
                    title = fm.get("title", slug)
                    pub_date = fm.get("pubDate") or fm.get("pub_date")
                    is_draft = fm.get("draft", "true").lower() in ["true", "yes", "1"]
                    category = fm.get("category", "Notes")
                    tags_str = fm.get("tags", "[]")
                    tags = [t.strip().strip("\"'") for t in re.findall(r'[\w-]+', tags_str) if t not in ["[", "]"]]
                    asset_files = [f for f in all_files if f != primary]

                    drafts.append(
                        DraftInfo(
                            slug=slug,
                            folder_path=item,
                            primary_file=primary,
                            title=title,
                            pub_date=pub_date,
                            is_draft=is_draft,
                            category=category,
                            tags=tags,
                            asset_files=asset_files,
                        )
                    )
                except Exception as err:
                    print(color(f"Warning: Could not read {primary}: {err}", Colors.YELLOW), file=sys.stderr)

        elif item.is_file() and item.suffix.lower() in [".md", ".mdx"]:
            slug = item.stem
            try:
                content = item.read_text(encoding="utf-8")
                fm, _ = parse_frontmatter(content)
                title = fm.get("title", slug)
                pub_date = fm.get("pubDate") or fm.get("pub_date")
                is_draft = fm.get("draft", "true").lower() in ["true", "yes", "1"]
                category = fm.get("category", "Notes")
                tags_str = fm.get("tags", "[]")
                tags = [t.strip().strip("\"'") for t in re.findall(r'[\w-]+', tags_str) if t not in ["[", "]"]]

                drafts.append(
                    DraftInfo(
                        slug=slug,
                        folder_path=item.parent,
                        primary_file=item,
                        title=title,
                        pub_date=pub_date,
                        is_draft=is_draft,
                        category=category,
                        tags=tags,
                        asset_files=[],
                    )
                )
            except Exception as err:
                print(color(f"Warning: Could not read {item}: {err}", Colors.YELLOW), file=sys.stderr)

    return drafts


def print_drafts_list(drafts: List[DraftInfo]):
    """Pretty-print discovered drafts in tabular/formatted list."""
    if not drafts:
        print(color("\nNo drafts found in docs/drafts/\n", Colors.YELLOW))
        return

    print(color(f"\n📁 Available Drafts ({len(drafts)} found):\n", Colors.BOLD + Colors.CYAN))
    print(f"{'#':<3} {'Slug':<44} {'Category':<14} {'Assets':<8} {'Status':<12} {'Title'}")
    print("─" * 105)

    for i, d in enumerate(drafts, 1):
        status = color("Draft", Colors.YELLOW) if d.is_draft else color("Published", Colors.GREEN)
        asset_count = f"{len(d.asset_files)} file(s)" if d.asset_files else "none"
        slug_disp = (d.slug[:40] + "...") if len(d.slug) > 44 else d.slug
        title_disp = (d.title[:38] + "...") if len(d.title) > 42 else d.title

        print(f"{i:<3} {color(slug_disp, Colors.BOLD):<53} {d.category:<14} {asset_count:<8} {status:<20} {title_disp}")
    print()


def match_draft(query: str, drafts: List[DraftInfo]) -> Optional[DraftInfo]:
    """Find a draft by exact or fuzzy slug/title matching."""
    q_lower = query.strip().lower()

    # 1. Exact slug match
    for d in drafts:
        if d.slug.lower() == q_lower:
            return d

    # 2. Slug substring match
    matches = [d for d in drafts if q_lower in d.slug.lower()]
    if len(matches) == 1:
        return matches[0]

    # 3. Title match
    title_matches = [d for d in drafts if q_lower in d.title.lower()]
    if len(title_matches) == 1:
        return title_matches[0]

    if matches:
        return matches[0]

    return None


def publish_single_draft(
    draft: DraftInfo,
    blog_dir: Path,
    target_slug: Optional[str] = None,
    keep_draft: bool = False,
    pub_date: Optional[str] = None,
    copy_only: bool = False,
    dry_run: bool = False,
    run_verify: bool = False,
    repo_root: Optional[Path] = None,
) -> bool:
    """Execute the move / publish operation for one draft."""
    slug = slugify(target_slug or draft.slug)
    target_dir = blog_dir / slug
    target_post = target_dir / "index.md"

    action_label = "Copying" if copy_only else "Moving"
    status_label = "draft (draft: true)" if keep_draft else "published (draft: false)"

    print(color(f"\n🚀 Processing: {draft.slug}", Colors.BOLD + Colors.CYAN))
    print(f"   • Source: {draft.folder_path / (draft.primary_file.name if draft.folder_path != draft.primary_file.parent else '')}")
    print(f"   • Target: {target_post}")
    print(f"   • Target Slug: {slug}")
    print(f"   • Action: {action_label}")
    print(f"   • Frontmatter Status: {status_label}")
    if pub_date:
        print(f"   • Publication Date: {pub_date}")

    if dry_run:
        print(color("\n[Dry Run] No filesystem modifications made.", Colors.YELLOW))
        return True

    # Ensure blog directory exists
    blog_dir.mkdir(parents=True, exist_ok=True)

    # Warn if target already exists
    if target_dir.exists():
        print(color(f"   ⚠️  Target directory {target_dir} already exists. Merging/overwriting files.", Colors.YELLOW))

    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Read source primary markdown file and update frontmatter
    try:
        source_content = draft.primary_file.read_text(encoding="utf-8")
        updated_content = update_frontmatter_text(
            source_content,
            set_draft=False if not keep_draft else True,
            new_pub_date=pub_date,
        )
    except Exception as err:
        print(color(f"❌ Error reading/updating markdown file: {err}", Colors.RED), file=sys.stderr)
        return False

    # 2. Copy/move assets if it is a directory
    if draft.folder_path.is_dir() and draft.folder_path != draft.primary_file:
        for file in draft.folder_path.iterdir():
            if file.is_file():
                if file == draft.primary_file:
                    continue
                dest = target_dir / file.name
                if copy_only:
                    shutil.copy2(file, dest)
                else:
                    shutil.move(str(file), str(dest))
                print(f"   ✓ Asset {file.name} -> {dest.name}")

    # 3. Write target index.md
    target_post.write_text(updated_content, encoding="utf-8")
    print(color(f"   ✓ Created {target_post.relative_to(blog_dir.parent.parent)}", Colors.GREEN))

    # 4. Clean up source if moving
    if not copy_only:
        try:
            if draft.folder_path.is_dir() and draft.folder_path != draft.primary_file:
                if draft.primary_file.exists():
                    draft.primary_file.unlink()
                remaining = list(draft.folder_path.iterdir())
                if not remaining or all(f.name.startswith(".") for f in remaining):
                    shutil.rmtree(draft.folder_path)
                    print(color(f"   ✓ Removed source draft folder: {draft.folder_path.name}", Colors.DIM))
            else:
                if draft.primary_file.exists():
                    draft.primary_file.unlink()
                    print(color(f"   ✓ Removed source draft file: {draft.primary_file.name}", Colors.DIM))
        except Exception as err:
            print(color(f"   ⚠️  Could not remove old draft files: {err}", Colors.YELLOW), file=sys.stderr)

    print(color(f"\n🎉 Successfully published '{draft.title}' to /blog/{slug}/", Colors.BOLD + Colors.GREEN))

    # 5. Optional verification run
    if run_verify and repo_root:
        verify_script = repo_root / "scripts" / "verify-post.mjs"
        if verify_script.exists():
            print(color(f"\n🔍 Running pre-publish verification gate for '{slug}'...\n", Colors.CYAN))
            cmd = ["node", str(verify_script), slug]
            res = subprocess.run(cmd, cwd=str(repo_root))
            if res.returncode != 0:
                print(color(f"\n⚠️  Verification gate returned warnings/errors. Please review above.", Colors.YELLOW))
            else:
                print(color(f"\n✅ Verification gate passed cleanly!", Colors.GREEN))

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Publish blog drafts from docs/drafts/ into src/content/blog/ in Astro folder format.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "draft_query",
        nargs="?",
        help="Slug or partial name of the draft to publish. Omit for interactive picker.",
    )
    parser.add_argument(
        "-l", "--list",
        action="store_true",
        help="List all available drafts in docs/drafts/ and exit.",
    )
    parser.add_argument(
        "-a", "--all",
        action="store_true",
        help="Publish all drafts found in docs/drafts/.",
    )
    parser.add_argument(
        "--keep-draft",
        action="store_true",
        help="Move folder to src/content/blog/ but keep draft: true (useful for dev preview/Studio editing).",
    )
    parser.add_argument(
        "--today",
        action="store_true",
        help="Update pubDate in frontmatter to today's date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--pub-date",
        type=str,
        help="Set a specific pubDate in frontmatter (format: YYYY-MM-DD).",
    )
    parser.add_argument(
        "--target-slug",
        type=str,
        help="Custom target slug/folder name in src/content/blog/ (defaults to source slug).",
    )
    parser.add_argument(
        "-c", "--copy",
        action="store_true",
        help="Copy files instead of moving them (preserves files in docs/drafts/).",
    )
    parser.add_argument(
        "-v", "--verify",
        action="store_true",
        help="Run post verification gate (node scripts/verify-post.mjs <slug>) after publishing.",
    )
    parser.add_argument(
        "-n", "--dry-run",
        action="store_true",
        help="Show what would be done without making any actual changes on disk.",
    )

    args = parser.parse_args()

    repo_root = find_repo_root()
    drafts_dir = repo_root / "docs" / "drafts"
    blog_dir = repo_root / "src" / "content" / "blog"

    all_drafts = find_drafts(drafts_dir)

    if args.list:
        print_drafts_list(all_drafts)
        return 0

    if not all_drafts:
        print(color(f"No drafts found in {drafts_dir.relative_to(repo_root)}/", Colors.YELLOW))
        return 0

    target_pub_date: Optional[str] = None
    if args.today:
        target_pub_date = date.today().isoformat()
    elif args.pub_date:
        target_pub_date = args.pub_date

    if args.all:
        print(color(f"\n📦 Publishing all {len(all_drafts)} drafts to src/content/blog/...\n", Colors.BOLD + Colors.CYAN))
        success_count = 0
        for d in all_drafts:
            if publish_single_draft(
                draft=d,
                blog_dir=blog_dir,
                target_slug=None,
                keep_draft=args.keep_draft,
                pub_date=target_pub_date,
                copy_only=args.copy,
                dry_run=args.dry_run,
                run_verify=args.verify,
                repo_root=repo_root,
            ):
                success_count += 1
        print(color(f"\n✨ Done! Processed {success_count}/{len(all_drafts)} drafts.", Colors.BOLD + Colors.GREEN))
        return 0

    selected_draft: Optional[DraftInfo] = None
    if args.draft_query:
        selected_draft = match_draft(args.draft_query, all_drafts)
        if not selected_draft:
            print(color(f"❌ Error: No draft matching '{args.draft_query}' found.", Colors.RED), file=sys.stderr)
            print_drafts_list(all_drafts)
            return 1
    else:
        print_drafts_list(all_drafts)
        try:
            choice = input(color("Select draft number to publish (or 'q' to quit): ", Colors.BOLD + Colors.CYAN)).strip()
            if choice.lower() in ["q", "quit", "exit", ""]:
                print("Aborted.")
                return 0
            idx = int(choice) - 1
            if 0 <= idx < len(all_drafts):
                selected_draft = all_drafts[idx]
            else:
                print(color("Invalid selection.", Colors.RED))
                return 1
        except (ValueError, KeyboardInterrupt, EOFError):
            print("\nAborted.")
            return 0

    if selected_draft:
        success = publish_single_draft(
            draft=selected_draft,
            blog_dir=blog_dir,
            target_slug=args.target_slug,
            keep_draft=args.keep_draft,
            pub_date=target_pub_date,
            copy_only=args.copy,
            dry_run=args.dry_run,
            run_verify=args.verify,
            repo_root=repo_root,
        )
        return 0 if success else 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
