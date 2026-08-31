---
name: what-is-post
description: Draft, verify, and publish posts in the "What Is …" series on this blog — short plain-language explainers with a fixed structure and a hard factual-verification gate. Use when the user asks to write, draft, check, review, or publish a "What is X?" post, add an idea to the What Is backlog, or work on any post carrying `series: "What Is"`. Also use when asked to start a new series on this blog.
---

# Writing the "What Is …" series

## Read the playbook first

`docs/series/what-is-playbook.md` is the source of truth for house style,
structure, front-matter, and the verification gate. **Read it before drafting or
reviewing.** This skill only tells you how to run the workflow; the playbook
tells you what a good post looks like. Where they appear to disagree, the
playbook wins.

## The three stages

### 1. Draft — `/what-is-draft <topic>`

1. Read the playbook (§2 contract, §3 shape, §4 voice, §5 front-matter).
2. **Research before writing.** These posts define technical terms; a definition
   assembled from memory is exactly the failure mode this series exists to
   avoid. Check current primary sources — vendor docs, specs, papers, release
   notes — for anything that could have changed. Anything involving Claude,
   Anthropic models, LLM pricing, or context limits: consult the `claude-api`
   skill rather than recalling numbers.
3. Pick the slug: `what-is-<thing>`, and create
   `src/content/blog/what-is-<thing>/index.md` (folder form, so images can sit
   beside the post).
4. Write front-matter per §5. Always `draft: true`. Always `series: "What Is"`.
   `category` is the section (Engineering, Notes …) — never `"What Is"`.
   Omit `seriesOrder` unless reading order must differ from publication order.
5. Write the post to the §3 shape and the §2 contract.
6. **Mark every uncertain claim inline** as `[?]` with a short note on what needs
   checking. The verification script treats `[?]` as a hard error, so nothing
   uncertain can reach publish by accident. Better a flagged draft than a
   confident wrong sentence.
7. Run `npm run verify:post -- <slug>` and fix what it reports.
8. Add the post to the **In flight** table in
   `docs/series/what-is-backlog.md`, removing it from the queue.
9. Tell the user the slug, the local preview URL
   (`http://localhost:4321/blog/<slug>/`), and every `[?]` you left behind.

**Never** publish in the same turn as drafting. The user reviews between stages;
that is the entire point of the pipeline.

### 2. Verify — `/what-is-verify <slug>`

Two halves. Run both.

**Mechanical:** `npm run verify:post -- <slug>`. Fix every error. Warnings are
judgement calls — report them, don't silently "fix" a length warning by padding.

**Factual — the half that matters.** For each claim in the post:

- Check it against a current primary source. State the source and its date.
- Numbers (context windows, prices, model names, benchmarks) rot fast. Either
  date them inline ("as of August 2026") or cut them.
- Follow every external link. Confirm it resolves *and* says what the post
  claims it says.
- Flag anything asserted more confidently than the evidence supports.
- Check the "What it is not" section is an honest boundary, not a strawman.

Write the findings to `docs/series/reviews/<slug>.md`: a table of claim →
source → verdict (confirmed / corrected / cut / unverifiable), then the
mechanical output, then a short "what I would still change" note.

Apply corrections that are unambiguous. **Ask the user** about anything that
changes the post's argument. Resolve or escalate every `[?]` — never leave one
standing after a verify pass.

Report to the user; do not publish.

### 3. Publish — `/what-is-publish <slug>`

Only after the user has said the post is good. Then:

1. Re-run `npm run verify:post -- <slug>` — it must pass clean.
2. Confirm `docs/series/reviews/<slug>.md` exists. If the post was never
   verified, say so and stop.
3. Set `draft: false` and `pubDate` to today (unless the user names a date).
   Add `updatedDate` only when republishing something already live.
4. Run the full gate: `./scripts/linux/dev-tests.sh` (or the `win/` equivalent).
5. Move the post from **In flight** to **Published** in the backlog.
6. Commit on the current working branch with a clear message. Push only when
   asked. Never push straight to `main`.

## Starting a different series

Nothing here is What-Is-specific except the house style. To start another
series: pick a display name, set `series: "<Name>"` in the front-matter, and add
an entry to `SERIES_META` in `src/consts.ts` for the blurb. The `/series` index
and `/series/<slug>` page appear automatically — no route or component work.
Add series-specific structural rules to `scripts/verify-post.mjs` only if the
new series wants a fixed shape the way What Is does.

## Hard rules

- A post never goes from draft to published without a human review turn.
- Never ship a factual claim you did not check against a source this session.
- `[?]` markers block publishing. That is deliberate; do not strip them to pass
  the gate.
- Drafts live in `src/content/blog/` with `draft: true`, not in `docs/drafts/`.
- `category` ≠ `series`. Category is the section; series is the thread.
