# The "What Is …" House Style

> What a good post in this series looks like. The `what-is` skill and
> `scripts/verify-post.mjs` both defer to this file, so change style here and
> nowhere else. Workflow lives in the skill; this is only about the writing.

## What the series is

Short, plain-language explainers of terms used far more often than they get
defined. One idea per post. The reader is a smart generalist — a colleague from
another team, not a beginner and not a specialist.

It serves two audiences: other people who want a straight answer, and future you
reloading a concept in three minutes. That second one is why verification is a
real gate and not a formality.

## What every post does

1. **Answers in the first 40 words.** A reader who bounces after one paragraph
   still leaves with the right answer.
2. **Says why the thing exists.** What hurt before it? A definition without a
   motivation is trivia.
3. **Draws one honest boundary** — what it is *not*, or what it gets confused
   with. This carries most of the value.
4. **Shows the mechanism**, concretely enough that the reader could explain it
   back.
5. **Names where it breaks.** A post with no limits section is an advertisement.
6. **Ends with the one-line version** the reader can quote.

## Shape

`## The short answer` · `## Why it exists` · `## How it actually works` ·
`## What it is not` · `## Where it breaks` · `## The one-line version`

A comparison post ("What is the difference between X and Y?") naturally leads
with the contrast table instead. Keep the six commitments above either way.

**Length is whatever the idea needs.** A term explained clearly in 300 words is
this series working. Past ~1200 you have written an essay — fine, just file it
without the series field.

## Voice

First person, present tense, contractions welcome. Short sentences. Bold the
term on first use, once. No hype adjectives — if the thing is impressive the
mechanism will show it. Never open with "In today's fast-paced world."

## Front-matter

```yaml
title: "What is an LLM?"        # sentence case, always a question mark
description: "One sentence, under 160 characters, answering the title."
pubDate: 2026-08-31
category: "Engineering"          # the section — NOT "What Is"
tags: ["ai", "llm"]
series: "What Is"                # this is what puts it in the series
seriesOrder: 3                   # optional; omit to order by pubDate
draft: true                      # every post starts here
```

`category` is the section; `series` is the thread. A post has both. Slug is
`what-is-<thing>`, as `src/content/blog/what-is-<thing>/index.md` so images
co-locate.

## The gate

**Mechanical** — `npm run verify:post -- <slug>` checks schema, structure,
description length, duplicate `seriesOrder`, and leftover `TODO`/`[?]` markers
and placeholder links.

**Factual — the half that matters.** Every claim checked against a current
primary source. Every number either dated inline ("as of August 2026") or cut.
Every link followed and confirmed to say what the post claims. Nothing asserted
more confidently than the evidence supports.

When a claim cannot be verified: **cut it or caveat it.** Anything uncertain is
marked `[?]` in the draft, and `[?]` is a hard error in the gate — so an
unverified sentence cannot reach publish by accident. Never strip a marker to
get past the gate; that inverts the only safeguard here.

Drafts live in `src/content/blog/` with `draft: true`, not `docs/drafts/`.
Drafts are hidden from production but visible in `npm run dev`, so you review a
post exactly as it will look. Publishing flips one boolean; nothing moves.
