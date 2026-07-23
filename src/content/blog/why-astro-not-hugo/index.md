---
title: "Why I built this on Astro instead of Hugo"
description: "A quick tour of the trade-offs between Astro, Hugo, and Jekyll for a personal blog on GitHub Pages."
pubDate: 2026-07-08
category: "Engineering"
tags: ["astro", "web"]
---

When you set out to build a blog on GitHub Pages, you quickly hit three popular
choices: **Hugo**, **Jekyll**, and **Astro**. All three produce a fast static
site. Here's why I landed on Astro.

## The short version

- **Hugo** is a single Go binary — blazing fast builds, near-zero maintenance,
  but its Go templating is awkward to bend once you want something custom.
- **Jekyll** is what GitHub Pages runs natively (no build step needed), but the
  Ruby toolchain and dated developer experience showed their age.
- **Astro** is component-based, ships almost no JavaScript by default, and lets
  me drop in an interactive island the day I actually need one.

## The deciding factor: build-time, not run-time

The thing that sold me is how Astro treats content. This post is a Markdown
file. At **build time**, Astro validates its front-matter against a schema and
compiles the body to HTML. By the time you read it, there's no Markdown parser
running, nothing to inject into — just static HTML.

That single idea removes a whole category of dependencies a runtime-rendering
app would need. It's the kind of simplicity that ages well.

## The one honest trade-off

Astro sits on Node and npm, so there's a modest dependency treadmill Hugo's
single binary avoids. For me, the design freedom is worth it. If your priority
were *"this exact look, zero maintenance, forever,"* Hugo would be the smarter
pick — and that's a perfectly good answer too.
