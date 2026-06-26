import crypto from "node:crypto";
import { readBearerToken, verifyReaderToken } from "./_reader-auth.js";

const allowedChapters = new Set(["prologue", "chapter-1"]);
const keyPrefix = "saltine-reborn:comments";

function isConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function runKvCommand(command) {
  const result = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!result.ok) {
    throw new Error("KV request failed.");
  }

  const payload = await result.json();

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result;
}

function commentsKey(chapter) {
  return `${keyPrefix}:${chapter}`;
}

function parseComment(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function fetchComments(chapter) {
  const values = await runKvCommand(["LRANGE", commentsKey(chapter), "0", "-1"]);

  return (Array.isArray(values) ? values : []).map(parseComment).filter(Boolean);
}

async function createComment(chapter, reader, body) {
  const comment = {
    id: crypto.randomUUID(),
    chapter_slug: chapter,
    reader_name: reader.name,
    reader_role: reader.role || "reader",
    body,
    created_at: new Date().toISOString()
  };

  await runKvCommand(["RPUSH", commentsKey(chapter), JSON.stringify(comment)]);
}

function parseBody(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body || "{}");
  }

  return request.body || {};
}

function validateRequest(request, response) {
  const reader = verifyReaderToken(readBearerToken(request));

  if (!reader) {
    response.status(401).json({
      ok: false,
      message: "Please sign in to join the discussion."
    });
    return null;
  }

  return reader;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  const reader = validateRequest(request, response);

  if (!reader) {
    return;
  }

  if (!isConfigured()) {
    response.status(200).json({
      ok: true,
      configured: false,
      comments: [],
      message: "Discussion storage is not configured yet."
    });
    return;
  }

  if (request.method === "GET") {
    const chapter = String(request.query?.chapter || "");

    if (!allowedChapters.has(chapter)) {
      response.status(400).json({ ok: false, message: "Unknown chapter." });
      return;
    }

    try {
      const comments = await fetchComments(chapter);
      response.status(200).json({ ok: true, configured: true, comments });
    } catch {
      response.status(502).json({
        ok: false,
        message: "The discussion could not be loaded."
      });
    }
    return;
  }

  if (request.method === "POST") {
    let body = {};

    try {
      body = parseBody(request);
    } catch {
      response.status(400).json({ ok: false });
      return;
    }

    const chapter = String(body.chapter || "");
    const commentBody = String(body.body || "").trim();

    if (!allowedChapters.has(chapter)) {
      response.status(400).json({ ok: false, message: "Unknown chapter." });
      return;
    }

    if (!commentBody || commentBody.length > 2000) {
      response.status(400).json({
        ok: false,
        message: "Comments must be between 1 and 2000 characters."
      });
      return;
    }

    try {
      await createComment(chapter, reader, commentBody);
      const comments = await fetchComments(chapter);
      response.status(201).json({ ok: true, configured: true, comments });
    } catch {
      response.status(502).json({
        ok: false,
        message: "The comment could not be posted."
      });
    }
    return;
  }

  response.setHeader("Allow", "GET, POST");
  response.status(405).json({ ok: false });
}
