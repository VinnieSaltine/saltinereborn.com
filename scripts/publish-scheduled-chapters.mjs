import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const TIME_ZONE = "America/New_York";
const QUEUE_DIR = "private/queued-chapters";
const SCHEDULE_PATH = "src/data/releaseSchedule.ts";
const CHAPTERS_PATH = "src/data/chapters.ts";
const LIBRARY_PATH = "src/pages/library.astro";

const args = parseArgs(process.argv.slice(2));
const dryRun = args.has("dry-run");
const now = getNow(args.get("now"));
const nowInNewYork = getTimeZoneStamp(now, TIME_ZONE);

log(`Mode: ${dryRun ? "dry run" : "publish"}`);
log(`Now in ${TIME_ZONE}: ${nowInNewYork}`);

const schedule = loadSchedule();
const dueChapters = schedule
  .filter((chapter) => {
    assertTimeZone(chapter);
    return getReleaseStamp(chapter) <= nowInNewYork;
  })
  .sort((a, b) => getReleaseStamp(a).localeCompare(getReleaseStamp(b)));

if (dueChapters.length === 0) {
  log("No scheduled chapters are due.");
  process.exit(0);
}

let chaptersText = readFileSync(join(ROOT, CHAPTERS_PATH), "utf8");
let libraryText = readFileSync(join(ROOT, LIBRARY_PATH), "utf8");
const missingSources = [];

for (const chapter of dueChapters) {
  const sourcePath = join(ROOT, QUEUE_DIR, chapter.sourcePdfFilename);
  const destinationPath = join(ROOT, chapter.publicDestinationPath);
  const chapterExists = hasChapter(chaptersText, chapter);
  const destinationExists = existsSync(destinationPath);

  if (!chapterExists && !destinationExists && !existsSync(sourcePath)) {
    missingSources.push(`${chapter.releaseLabel}: ${join(QUEUE_DIR, chapter.sourcePdfFilename)}`);
  }
}

if (missingSources.length > 0) {
  fail(`Missing scheduled source PDF(s):\n${missingSources.map((item) => `- ${item}`).join("\n")}`);
}

let latestDueChapter = dueChapters.at(-1);
let changed = false;

for (const chapter of dueChapters) {
  const sourcePath = join(ROOT, QUEUE_DIR, chapter.sourcePdfFilename);
  const destinationPath = join(ROOT, chapter.publicDestinationPath);
  const chapterExists = hasChapter(chaptersText, chapter);
  const destinationExists = existsSync(destinationPath);

  if (chapterExists && destinationExists) {
    log(`Already current: ${chapter.releaseLabel}`);
    continue;
  }

  if (!destinationExists) {
    log(`${dryRun ? "Would copy" : "Copying"} ${chapter.sourcePdfFilename} -> ${chapter.publicDestinationPath}`);
    if (!dryRun) {
      mkdirSync(dirname(destinationPath), { recursive: true });
      copyFileSync(sourcePath, destinationPath);
    }
    changed = true;
  } else {
    log(`PDF already present: ${chapter.publicDestinationPath}`);
  }

  if (!chapterExists) {
    log(`${dryRun ? "Would add" : "Adding"} chapter entry: ${chapter.releaseLabel}`);
    if (!dryRun) {
      chaptersText = appendChapter(chaptersText, chapter);
    }
    changed = true;
  } else {
    log(`Chapter entry already present: ${chapter.releaseLabel}`);
  }
}

const updatedLibraryText = updateLibraryProgress(libraryText, latestDueChapter.releaseLabel);
if (updatedLibraryText !== libraryText) {
  log(`${dryRun ? "Would update" : "Updating"} Library progress label to ${latestDueChapter.releaseLabel}`);
  if (!dryRun) {
    libraryText = updatedLibraryText;
  }
  changed = true;
}

if (dryRun) {
  log("Dry run complete. No files were changed.");
  process.exit(0);
}

if (changed) {
  writeFileSync(join(ROOT, CHAPTERS_PATH), chaptersText);
  writeFileSync(join(ROOT, LIBRARY_PATH), libraryText);
  log("Publishing updates written.");
} else {
  log("No changes needed.");
}

function parseArgs(rawArgs) {
  const parsed = new Map();

  for (const arg of rawArgs) {
    if (arg === "--dry-run") {
      parsed.set("dry-run", "true");
      continue;
    }

    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      parsed.set(match[1], match[2]);
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function getNow(input) {
  if (!input) {
    return new Date();
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    fail(`Invalid --now value: ${input}`);
  }

  return parsed;
}

function getTimeZoneStamp(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function loadSchedule() {
  const text = readFileSync(join(ROOT, SCHEDULE_PATH), "utf8");
  const match = text.match(/export const releaseSchedule = (\[[\s\S]*?\]);/);

  if (!match) {
    fail(`Could not read release schedule from ${SCHEDULE_PATH}`);
  }

  try {
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (error) {
    fail(`Could not parse release schedule: ${error.message}`);
  }
}

function assertTimeZone(chapter) {
  if (chapter.releaseTimeZone !== TIME_ZONE) {
    fail(`${chapter.releaseLabel} uses unsupported time zone: ${chapter.releaseTimeZone}`);
  }
}

function getReleaseStamp(chapter) {
  return `${chapter.releaseDate}T${chapter.releaseTime}`;
}

function hasChapter(chaptersText, chapter) {
  return chaptersText.includes(`slug: "${chapter.slug}"`);
}

function appendChapter(chaptersText, chapter) {
  const marker = "\n];";
  const markerIndex = chaptersText.lastIndexOf(marker);

  if (markerIndex === -1) {
    fail(`Could not find chapter array closing marker in ${CHAPTERS_PATH}`);
  }

  const before = chaptersText.slice(0, markerIndex).trimEnd();
  const after = chaptersText.slice(markerIndex);
  const needsComma = !before.endsWith("[");

  return `${before}${needsComma ? "," : ""}\n${formatChapter(chapter)}${after}`;
}

function formatChapter(chapter) {
  return `  {
    slug: "${chapter.slug}",
    sequence: "${chapter.sequence}",
    title: "${chapter.title}",
    releaseLabel: "${chapter.releaseLabel}",
    description:
      "${chapter.description}",
    pdfHref: "${chapter.pdfHref}"
  }`;
}

function updateLibraryProgress(libraryText, releaseLabel) {
  const updated = libraryText.replace(/progressLabel: "[^"]+"/, `progressLabel: "${releaseLabel}"`);

  if (updated === libraryText && !libraryText.includes(`progressLabel: "${releaseLabel}"`)) {
    fail(`Could not update progressLabel in ${LIBRARY_PATH}`);
  }

  return updated;
}

function log(message) {
  console.log(`[scheduled-publish] ${message}`);
}

function fail(message) {
  console.error(`[scheduled-publish] ${message}`);
  process.exit(1);
}
