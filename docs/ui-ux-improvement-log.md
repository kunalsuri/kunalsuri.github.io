# UI/UX Improvement Log

> Principal UI/UX + frontend audit of kunalsuri.github.io.
> Tracks the plan, acceptance criteria, and rolling progress for this pass.
> Branch: `claude/frontend-ui-ux-audit-s1rixi`

## Audit method

Read through the full page/component/layout/style surface (`BaseLayout`, `Header`,
`Footer`, `BlogPost`, `PostCard`, `BaseHead`, `global.css`, all top-level pages,
and the interactive Astro islands: `ClapButton`, `AudioPlayer`,
`SelectionToolbar`, `NewsletterCTA`, `Comments`, `ThemeToggle`). Checked color
contrast math for the token palette (light + dark), reviewed `astro.config.mjs`
and `package.json` for available tooling, and rendered the site at 320/390/768/1440
widths in a real browser to confirm layout claims before writing them down.

The site's existing "Keynote" design system is deliberate and well executed —
this pass is corrective/polish, not a redesign. Every item below preserves the
current architecture, components, and dependency set (one addition: a static
PNG asset generated from the existing SVG, using `sharp`, which is already a
transitive dependency via Astro's image pipeline — no new package installed).

## Findings ranked by impact

| # | Improvement | User impact | Frequency | Consistency benefit | Confidence | Regression risk |
|---|---|---|---|---|---|---|
| 1 | Social share preview image is broken on most platforms | High — broken previews on every shared link | Every share (LinkedIn/Twitter/Slack/iMessage/Facebook) | N/A (bug fix) | High | Low |
| 2 | No "Skip to content" link | High for keyboard/screen-reader users | Every page load | Site-wide | High | Low |
| 3 | No custom 404 page | High for anyone hitting a dead/typo'd link | Occasional but real (GitHub Pages serves `404.html` automatically) | Site-wide | High | Low |
| 4 | `NewsletterCTA` breaks the site's restrained color language | Medium — visual inconsistency on every post | Every article view | High — realigns with "boldness spent in ONE place" principle | High | Low |
| 5 | Active nav link isn't exposed to assistive tech | Medium a11y gap | Every page load | Site-wide | High | Low |
| 6 | Interactive widget state not announced (`AudioPlayer`, `ClapButton`) | Medium a11y gap for screen-reader users | Every post w/ TTS or clap use | Site-wide pattern | Medium | Low |
| 7 | Motion not reduced consistently for `prefers-reduced-motion` | Medium comfort/a11y gap | Site-wide (hover lifts, clap pop, live-ping dot) | Site-wide | High | Low |

Items considered and explicitly **not** taken: self-hosting Google Fonts
(current preconnect + `display=swap` setup is already reasonable; swapping to
`@fontsource` is a bigger dependency change for marginal gain), keyboard-operable
image lightbox (real gap, but touching every `.prose img` click handler for a
decorative zoom feature is disproportionate risk for this pass), and reworking
color contrast (measured: `--muted` and `--accent` both clear WCAG AA in light
and dark — no action needed).

## Acceptance criteria

1. **Social share image** — `og:image` / `twitter:image` point to a real raster
   (PNG) asset that renders correctly when unfurled by platforms that don't
   support SVG previews. Visual parity with the existing SVG design.
2. **Skip link** — A visually-hidden-until-focused "Skip to content" link is
   the first focusable element on every page and moves focus to `<main>`.
3. **404 page** — Visiting an unknown path renders an on-brand page (matches
   the design system: eyebrow, display heading, body copy, link home) instead
   of a bare GitHub Pages error. Confirmed to build to `dist/404.html`.
4. **NewsletterCTA** — Card styling uses the site's token palette
   (`--ink`/`--muted`/`--accent`/`--line`/`--surface`) instead of hardcoded
   brand hex colors and colored glow shadows, while keeping the Substack/LinkedIn
   iconography legible and the two platform cards visually distinct from each
   other via layout, not saturated color.
5. **Active nav state** — The current page's nav link carries
   `aria-current="page"`.
6. **Widget state announcements** — `AudioPlayer`'s play/pause button reflects
   its state via `aria-pressed` and an updated accessible name; status text
   region is `aria-live="polite"` so screen-reader users hear state changes
   without needing to poll.
7. **Reduced motion** — Hover-transform animations, the clap "+1" float, and
   the newsletter "live" ping dot are skipped or simplified under
   `prefers-reduced-motion: reduce`, consistent with the existing `.reveal`
   treatment.

Each item must pass, after implementation: `npm run check` (0 errors),
`npm run test:unit`, `npm run test:integration`, and `npm run build` — plus a
manual look at the affected page(s) in the dev server.

## Progress log

- [x] 1. Social share preview image (og:image/twitter:image → PNG) — `og-default.svg`
      rewritten to use plain SVG `<text>`/`<tspan>` instead of `<foreignObject>`
      (which several rasterizers, including the `sharp`/librsvg pipeline used to
      generate the PNG, don't render), then rasterized to `public/og-default.png`
      via `sharp` (already a transitive dep). `BaseHead.astro` now points
      `og:image`/`twitter:image` at the PNG and adds `og:image:type/width/height`.
- [ ] 2. Skip-to-content link
- [ ] 3. Custom 404 page
- [ ] 4. NewsletterCTA palette realignment
- [ ] 5. `aria-current="page"` on active nav link
- [ ] 6. AudioPlayer state announcements
- [ ] 7. `prefers-reduced-motion` coverage for remaining animations

Entries are checked off with a commit reference as each unit lands, below.
