# The "What Is …" Playbook

> The single source of truth for how a **What Is** post gets written, checked, and
> shipped. The Agent Skills in `.claude/skills/` and the `verify:post` script all
> defer to this file. Change the house style here, not in three places.

## 1. What the series is

Short, plain-language explainers of terms that get used far more often than they
get defined. One idea per post. The reader is a smart generalist — a colleague
from another team, not a beginner and not a specialist.

The series exists for two audiences at once:

- **Other people**, who want a straight answer without a textbook.
- **Future you**, who wants to reload a concept in three minutes and trust that
  the version on the page is the one you actually believed after checking.

That second audience is why verification is a real gate and not a formality.

## 2. The contract every post keeps

A post is a **What Is** post only if it does all six:

1. **Answers in the first 40 words.** No throat-clearing, no history lesson
   before the definition. A reader who bounces after one paragraph should still
   leave with the right answer.
2. **Explains why the thing exists.** What was painful before it? A definition
   without a motivation is trivia.
3. **Draws one honest boundary.** What it is *not*, or what it is most often
   confused with. This section carries most of the value.
4. **Shows the mechanism.** Concretely enough that the reader could explain it
   back. A small example, a short table, or a numbered walkthrough.
5. **Names where it breaks.** Limits, failure modes, the part the marketing
   copy skips. A post with no limits section is an advertisement.
6. **Ends with the one-line version.** A "if you remember one thing" close the
   reader can quote.

## 3. Shape

| Section | Heading | Length |
|---|---|---|
| The short answer | `## The short answer` | 2–4 sentences |
| Why it exists | `## Why it exists` | 1–2 paragraphs |
| How it actually works | `## How it actually works` | The bulk — prose, a table, or numbered steps |
| What it is not | `## What it is not` | A contrast list or table |
| Where it breaks | `## Where it breaks` | 3–5 bullets |
| The one-line version | `## The one-line version` | 1 sentence, bolded |

Deviate when a topic demands it — a comparison post ("What is the difference
between X and Y?") naturally leads with the contrast table. Keep the *contract*
in §2 either way.

**Target length: 700–1,200 words.** Under 700 and it is a tweet; over 1,200 and
it stopped being a What Is post and became an essay. An essay is fine — file it
without the series field.

## 4. Voice

- First person, present tense, contractions welcome.
- Short sentences. Cut every "it is important to note that".
- Bold the term being defined on first use, once.
- No hype adjectives (*revolutionary*, *game-changing*, *powerful*). If the
  thing is impressive, the mechanism will show it.
- No em-dash pileups; one per paragraph at most.
- British/American spelling: whatever the rest of the blog uses — stay
  consistent within a post.
- **Never** open with "In today's fast-paced world" or any variant.

## 5. Front-matter

```yaml
title: "What is an LLM?"
description: "One sentence, under 160 characters, that answers the title."
pubDate: 2026-08-31
category: "Engineering"        # the section — NOT "What Is"
tags: ["ai", "llm"]
series: "What Is"              # this is what puts it in the series
seriesOrder: 3                 # optional; omit to order by pubDate
draft: true                    # every post starts here
```

Two rules that are easy to get wrong:

- `category` is the **section** (Engineering, Notes, …). `series` is the
  **thread**. They are orthogonal — a post has both. Do not set
  `category: "What Is"`.
- `seriesOrder` is optional. Omit it and the post sorts by `pubDate`. Set it
  only when reading order must differ from publication order — for example when
  you publish a prerequisite explainer after the post that needs it.

**Title format:** `What is <thing>?` — sentence case, always a question mark.
For comparisons: `What is the difference between <A> and <B>?`

**Slug:** `what-is-<thing>` — drop the question mark, hyphenate.
Folder form: `src/content/blog/what-is-<thing>/index.md`, so images co-locate.

## 6. Verification — the part that matters

A draft is not a candidate for publishing until every box is ticked. The
mechanical half is automated (`npm run verify:post -- <slug>`); the judgement
half is yours.

### Automated (the script checks these)

- Front-matter parses and satisfies the schema.
- `series`, `category`, `description` present; description ≤ 160 characters.
- Title matches the `What is …?` pattern; slug matches the title.
- Required headings from §3 are present.
- Word count inside 700–1,200.
- No unresolved `TODO`, `TKTK`, `[?]`, or `XXX` markers.
- No placeholder links (`example.com`, bare `#`).
- `seriesOrder`, if set, is a positive integer and unique within the series.

### Human / factual (Claude drafts these findings; **you** sign off)

- **Every factual claim is checked against a current primary source.** Not
  recalled from memory. Vendor docs, papers, specs, release notes — dated.
- **Every number carries a date.** Context windows, prices, model names and
  benchmark figures rot within months. Either date them inline ("as of August
  2026") or cut them.
- **Every external link resolves** and says what the post claims it says.
- **The boundary section is genuinely honest** — it names the confusion a real
  reader has, not a strawman.
- **Nothing is asserted with more confidence than the evidence supports.** If
  the field disagrees, say the field disagrees.
- **It reads aloud cleanly.** Read the first and last paragraph out loud. If you
  stumble, rewrite.

When a claim cannot be verified, the rule is: **cut it or caveat it.** Never
ship an unverified confident sentence. Anything genuinely uncertain gets marked
in the draft so review catches it.

## 7. Lifecycle

```
idea  →  draft  →  verify  →  review (you)  →  publish
```

| Stage | State on disk | How you get there |
|---|---|---|
| **Idea** | A line in `docs/series/what-is-backlog.md` | Add it any time; no ceremony |
| **Draft** | `src/content/blog/what-is-<x>/index.md`, `draft: true` | `/what-is-draft <topic>` |
| **Verify** | Same file + a report in `docs/series/reviews/` | `/what-is-verify <slug>` |
| **Review** | Same file; you edit freely | Read it at `localhost:4321/blog/<slug>/`, or edit in `/studio`, or in Antigravity |
| **Publish** | `draft: false`, `pubDate` set to today | `/what-is-publish <slug>` |

Drafts live **inside** `src/content/blog/` rather than `docs/drafts/`, on
purpose: `draft: true` is hidden from production builds but *visible in
`npm run dev`*. So you review the post as it will actually look — real
typography, real table of contents, real reading time, real series navigation —
instead of a raw Markdown approximation. Nothing has to move at publish time;
one boolean flips.

`docs/drafts/` remains for imported or half-abandoned pieces that are not yet
shaped like posts.

## 8. How the pipeline is built, and working with Antigravity

The pipeline is five **Agent Skills** in `.claude/skills/`, mirrored to
`.agents/skills/`. Anthropic merged custom slash commands into skills, so skills
are the supported format; a skill's directory name is the command you type.

| Skill | Invoked by | Why |
|---|---|---|
| `what-is-post` | Claude, automatically | House style. Loads whenever you work on a series post. |
| `what-is-draft` | You only | Creates files. `disable-model-invocation: true` |
| `what-is-verify` | You only | The review turn is yours to start. `disable-model-invocation: true` |
| `what-is-publish` | You only | Publishing is never something Claude decides. `disable-model-invocation: true` |
| `what-is-status` | Either | Read-only, so Claude may run it freely. |

Those three `disable-model-invocation` flags are what make §7's "never draft and
publish in the same turn" a mechanical guarantee rather than an instruction an
agent might talk itself out of: Claude Code blocks the call outright and can
only suggest that you run it.

Antigravity, Claude Code, and any other agent read the same instructions —
`AGENTS.md` / `CLAUDE.md` / `.agents/AGENTS.md` are exact mirrors, and
`.agents/skills/` carries the same five skills. So you can draft in one tool,
verify in another, and save from Antigravity without the house style drifting.

If a tool does not support skills, open this playbook and follow §3–§6 directly,
or run `npm run verify:post -- <slug>` from its terminal — the mechanical gate is
a plain Node script with no agent in the loop.

## 9. Idea capture

Keep `docs/series/what-is-backlog.md` cheap to add to. An idea is one line: the
title, plus a note on the angle if you have one. Do not pre-plan the series —
the ordering is `pubDate` by default, precisely so you never owe the backlog a
schedule.
