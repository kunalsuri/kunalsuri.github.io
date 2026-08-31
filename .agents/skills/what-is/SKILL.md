---
name: what-is
description: Write, check, and publish posts in this blog's "What Is …" series — short plain-language explainers with a hard factual-verification gate. Use this whenever the user wants a "What is X?" post drafted, fact-checked, or shipped, mentions the What Is series or its backlog, asks where a post stands, works on any post whose front-matter series is What Is, or wants to start a new post series here — even if they never say the series by name.
argument-hint: <topic to write, or slug of a post in progress>
disable-model-invocation: true
---

# The "What Is …" series

One command runs the whole pipeline. `$ARGUMENTS` is either a topic to write or
the slug of a post already in flight — you work out which, and what to do next,
by looking at the disk. Never ask the user which stage they are at; they should
not have to track that.

## Work out the stage first

Run `node scripts/verify-post.mjs --stage` (or `-- <slug>`) and act on what it
reports. The disk is the only source of truth, so this can never be stale:

| Stage | What is on disk | What you do |
|---|---|---|
| **idea** | no matching post | **Draft** it |
| **draft** | `draft: true`, no review file | **Verify** it |
| **verified** | `draft: true`, `docs/series/reviews/<slug>.md` exists | **Publish** — but only after the user says go |
| **published** | `draft: false` | Nothing. Say so. |

If `$ARGUMENTS` is empty, report every series post's stage and the single most
useful next action, then stop.

Read `docs/series/what-is-playbook.md` before drafting or verifying. It holds
the house style; this file only holds the workflow.

## Draft

1. **Research first.** These posts define technical terms. A definition
   assembled from memory is the exact failure this series exists to avoid, so
   check current primary sources — vendor docs, specs, papers, release notes.
   For anything touching Claude, Anthropic models, LLM pricing or context
   limits, consult the `claude-api` skill instead of recalling numbers.
2. Create `src/content/blog/what-is-<slug>/index.md`, folder form so images sit
   beside the post. Front-matter per the playbook: always `draft: true`, always
   `series: "What Is"`, and `category` is the section (Engineering, Notes …),
   never `"What Is"`.
3. Write it. Say the answer in the first 40 words, then why the thing exists,
   how it works, what it is *not*, where it breaks, and a one-line close.
   Length is whatever the idea needs — a term explained clearly in 300 words is
   the series working, not failing.
4. **Mark anything you could not fully verify as `[?]`** with a note on what
   needs checking. The gate treats `[?]` as a hard error, so nothing uncertain
   can reach publish by accident. A flagged draft beats a confident wrong
   sentence.
5. Run `npm run verify:post -- <slug>` and fix what it reports.
6. Report the slug, `http://localhost:4321/blog/<slug>/`, and every `[?]` left.

Stop there. Drafting and publishing in one turn would skip the user's review,
which is the whole point of the pipeline.

## Verify

Two halves, both required.

**Mechanical:** `npm run verify:post -- <slug>`. Fix errors. Report warnings
rather than silencing them.

**Factual — the half that matters.** For each claim: check it against a current
primary source and name that source with its date. Follow every external link
and confirm it says what the post claims. Numbers rot fast, so date them inline
or cut them. Flag anything asserted more confidently than the evidence supports,
and make sure "what it is not" answers a confusion a real reader has rather than
a strawman.

Resolve or escalate every `[?]`; none may survive this pass. Write the findings
to `docs/series/reviews/<slug>.md` — claim, source, verdict, then what you would
still change. Apply unambiguous corrections; ask before anything that changes
the post's argument.

Report and stop. Publishing is the user's call.

## Publish

Only when the user has said the post is good. If they have not, tell them what
you found and ask. Refuse if no review file exists — an unverified post is not
publishable, and saying so is more useful than shipping it.

Then: re-run the gate clean, set `draft: false` and `pubDate` to today, run
`bash scripts/linux/dev-tests.sh`, and commit on the current branch. Do not push
unless asked, and never to `main`.

## Starting a different series

Nothing above is What-Is-specific except the house style. Set
`series: "<Name>"` in front-matter and add a `SERIES_META` entry in
`src/consts.ts` for the blurb — `/series` and `/series/<slug>` appear on their
own. Add structural rules to `scripts/verify-post.mjs` only if the new series
wants a fixed shape.
