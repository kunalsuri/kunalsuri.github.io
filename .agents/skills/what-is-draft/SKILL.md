---
name: what-is-draft
description: Draft a new "What is …?" post from a topic, as a reviewable draft with draft:true. Creates files, so it is invoked deliberately rather than automatically.
argument-hint: <topic, e.g. "an LLM" or "the difference between a Skill and a Command">
disable-model-invocation: true
---

Draft a new post in the **What Is** series on the topic: **$ARGUMENTS**

Follow the `what-is-post` skill and `docs/series/what-is-playbook.md`.

Required behaviour:

1. Research the topic against current primary sources before writing a single
   line. Do not assemble a definition from memory.
2. Create `src/content/blog/what-is-<slug>/index.md` with `draft: true` and
   `series: "What Is"`.
3. Write to the playbook's §2 contract and §3 shape.
4. Mark every claim you could not fully verify inline as `[?]` with a note.
5. Run `npm run verify:post -- <slug>` and fix the errors it reports.
6. Add the post to the **In flight** table in `docs/series/what-is-backlog.md`.

Then stop and report: the slug, the preview URL, every `[?]` you left, and
anything you deliberately left out. **Do not publish and do not flip `draft`.**
