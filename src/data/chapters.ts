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
  }
];

export type Chapter = (typeof chapters)[number];
