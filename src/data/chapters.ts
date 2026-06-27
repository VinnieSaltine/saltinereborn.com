export const chapters = [
  {
    slug: "prologue",
    sequence: "Prologue",
    title: "The Saltine Reborn",
    releaseLabel: "Prologue",
    description:
      "Begin at the threshold of the new Saltine Reborn serial before stepping into Chapter One.",
    pdfHref: "/books/The-Saltine-Reborn/The-Saltine-Reborn-Prologue.pdf"
  },
  {
    slug: "chapter-1",
    sequence: "Chapter One",
    title: "The Saltine Reborn",
    releaseLabel: "Chapter One",
    description:
      "The story continues with the first full chapter of The Saltine Reborn.",
    pdfHref: "/books/The-Saltine-Reborn/The-Saltine-Reborn-Chapter-1.pdf"
  },
  {
    slug: "chapter-2",
    sequence: "Chapter Two",
    title: "The Saltine Reborn",
    releaseLabel: "Chapter Two",
    description:
      "The next released chapter in The Saltine Reborn reading room.",
    pdfHref: "/books/The-Saltine-Reborn/The-Saltine-Reborn-Chapter-2.pdf",
    releaseAt: "2026-06-26T19:00:00-04:00",
    releaseMessage: "Chapter Two opens at 7:00 PM Eastern."
  },
  {
    slug: "chapter-3",
    sequence: "Chapter Three",
    title: "The Saltine Reborn",
    releaseLabel: "Chapter Three",
    description:
      "The newest chapter in The Saltine Reborn reading room.",
    pdfHref: "/books/The-Saltine-Reborn/The-Saltine-Reborn-Chapter-3.pdf",
    releaseAt: "2026-06-27T19:00:00-04:00",
    releaseMessage: "Chapter Three opens at 7:00 PM Eastern tonight."
  }
];

export type Chapter = (typeof chapters)[number];
