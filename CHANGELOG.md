# Changelog

## 1.0.1 — 2026-11-09

- Prepare the first 1.x npm publication by aligning the package and lockfile versions with
  the release tag. The earlier `v1.0.0` GitHub release failed its tag/version check
  before npm publication.
- Include scheduled Mind Elixir stable-release compatibility checks and optional advisory
  prerelease checks from #13. No runtime API changes.

## 0.1.4 — 2026-10-18

- README: measured sizes in bytes and in kB/MB, against Pele's SVG and a PNG, and a pointer to
  [@erseco/mind-elixir-export-svg](https://github.com/erseco/mind-elixir-export-svg) for an SVG
  that keeps the editor's look. No code changes.

## 0.1.3 — 2026-10-18

- Renamed to `@erseco/mind-elixir-export-mermaid`, and the repository moved to
  [erseco/mind-elixir-export-mermaid](https://github.com/erseco/mind-elixir-export-mermaid).
  `@ateeducacion/mind-elixir-export-mermaid` is deprecated; replace it with the new name. No code
  changes.

## 0.1.2 — 2026-10-18

- Encode `%` (`#37;`). Mermaid removes `%%{...}%%` directives anywhere in the source before
  parsing, so a topic containing one lost that text or made the whole diagram fail to parse.
- Added a security policy and threat model (`SECURITY.md`), and type checking now also fails on
  unused code and implicit returns. No other changes to the published code.

## 0.1.1 — 2026-10-18

- Published from CI with npm Trusted Publishing and provenance. No code changes.

## 0.1.0 — 2026-10-18

- First release: `mindElixirToMermaid(data, options)` converts Mind Elixir data or a node
  to Mermaid `mindmap` source, with node shapes, classes, icons, markdown strings for bold,
  italic and line breaks, and the option to leave out folded branches.
- Text is escaped with Mermaid entity codes, so any topic renders as typed in Mermaid and
  in Pele.
