---
name: awesome-design
description: Library of 74 DESIGN.md files analysing real brand design systems (SpaceX, Apple, Linear, Stripe, Tesla, Nike, Vercel, Figma, BMW, Ferrari, etc.) - colour tokens, type scales, spacing, components, motion. Use when looking for design references, benchmarking a visual direction, borrowing a proven token system, or answering "what does <brand> do for X".
---

# Awesome Design (DESIGN.md reference library)

Vendored from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(commit f696123, 2026-09-21). Each file in `systems/` is one brand's design language in
the Google Stitch DESIGN.md format: YAML front matter with tokens (colours, typography,
radii, spacing), followed by prose on layout, components, imagery and do/don't rules.

## How to use

1. List `systems/` and pick 1-3 references that fit the design read. For NEO (orbital
   navigation, aerospace mood) the closest starting points are `spacex`, `tesla`,
   `nvidia`, `apple`, `linear.app`, `bugatti`.
2. Read only the files you need. They are long; grep for a section (`typography:`,
   `## Components`, `## Motion`) instead of reading whole files when possible.
3. Treat them as **reference, not specification**. Borrow principles and proportions;
   do not copy a brand's identity wholesale, and never override this project's own
   fonts, colours or conventions in `AGENTS.md` without the user agreeing.
4. When citing a reference to the user, name the brand and the specific token or rule.

## Refreshing

```bash
git clone --depth 1 https://github.com/VoltAgent/awesome-design-md.git /tmp/adm
for d in /tmp/adm/design-md/*/; do cp "$d/DESIGN.md" ".claude/skills/awesome-design/systems/$(basename "$d").md"; done
```
