# Scheduled Chapter Publishing

The Saltine Reborn remains a static Astro/Vercel site. Scheduled publishing is
handled by a file-based GitHub Action that copies due PDFs into `public/`, adds
chapter entries, commits the result, and lets Vercel deploy the commit.

## Current Source Of Truth

- Released chapters: `src/data/chapters.ts`
- Library progress label: `src/pages/library.astro`
- Release schedule: `src/data/releaseSchedule.ts`
- Private queue: `private/queued-chapters/`
- Publisher script: `scripts/publish-scheduled-chapters.mjs`
- Automation: `.github/workflows/publish-scheduled-chapters.yml`

## Queueing PDFs

Place unreleased chapter PDFs in:

```text
private/queued-chapters/
```

Use the exact filename listed in `src/data/releaseSchedule.ts`, for example:

```text
private/queued-chapters/The-Saltine-Reborn-Chapter-25.pdf
```

Do not place unreleased PDFs in `public/books/The-Saltine-Reborn/`. Files in
`public/` are public after deployment.

For GitHub Actions to publish automatically, queued PDFs must be committed to
the repository. The repository must remain private while unpublished PDFs are
committed there.

## Release Schedule

Each entry in `src/data/releaseSchedule.ts` includes:

- `chapterNumber`
- `slug`
- `sequence`
- `title`
- `releaseLabel`
- `description`
- `sourcePdfFilename`
- `publicDestinationPath`
- `pdfHref`
- `releaseDate`
- `releaseTime`
- `releaseTimeZone`

The current schedule uses `08:00:00` in `America/New_York`. The script compares
the current New York wall-clock time to each scheduled New York release time, so
daylight saving time is handled by the runtime timezone database instead of a
fixed UTC offset.

## Local Testing

Dry run with the actual current time:

```bash
npm run publish:scheduled -- --dry-run
```

Dry run against a simulated release time:

```bash
npm run publish:scheduled -- --dry-run --now=2026-07-18T12:00:00Z
```

On July 18, 2026, `12:00:00Z` is 8:00 AM in `America/New_York`.

Run a real local publish:

```bash
npm run publish:scheduled
```

Then verify:

```bash
npm run build
```

## GitHub Action

The workflow runs hourly at minute 7 UTC:

```text
7 * * * *
```

It does not rely on a fixed UTC release hour. The hourly workflow lets the Node
script decide whether it is at or after 8:00 AM in `America/New_York`.

GitHub scheduled workflows are not guaranteed to start at the exact second of
the cron schedule, so publication may happen a few minutes after 8:00 AM. The
script still prevents early release and ensures each chapter is published only
once.

The workflow can also be triggered manually from GitHub Actions. Manual runs
default to dry-run mode.

## Required Repository Settings

- Actions must be enabled for the repository.
- Workflow permissions must allow GitHub Actions to write repository contents.
- The workflow uses the default `GITHUB_TOKEN` with `contents: write`.
- If branch protection blocks direct pushes to `main`, either allow GitHub
  Actions to bypass the rule or switch the workflow to open a pull request.
- Vercel should remain connected to the repository so a commit to `main`
  triggers production deployment.

## Recovery

If a scheduled run fails because a source PDF is missing:

1. Add the missing PDF to `private/queued-chapters/`.
2. Commit and push it.
3. Manually run the workflow.

If a run is missed, the next successful run publishes all overdue scheduled
chapters in chronological order.

If a chapter was copied but not committed, rerun:

```bash
npm run publish:scheduled
npm run build
git status --short
```

Then commit the changed public PDF and data files.

## Pausing Or Changing The Schedule

To pause all scheduled publishing, disable the GitHub Action in the GitHub UI or
comment out the `schedule` block in `.github/workflows/publish-scheduled-chapters.yml`.

To pause a single chapter, move its `releaseDate` into the future.

To change the daily release time, edit `releaseTime` in
`src/data/releaseSchedule.ts`. Keep `releaseTimeZone` as `America/New_York`.
