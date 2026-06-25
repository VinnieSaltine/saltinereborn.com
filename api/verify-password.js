import crypto from "node:crypto";

function hash(value) {
  return crypto.createHash("sha256").update(value).digest();
}

function matches(candidate, expected) {
  return crypto.timingSafeEqual(hash(candidate), hash(expected));
}

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false });
    return;
  }

  const configuredPassword = process.env.SITE_PASSWORD || process.env.SALTINE_REBORN_PASSWORD;

  if (!configuredPassword) {
    response.status(503).json({
      ok: false,
      message: "Access is not configured."
    });
    return;
  }

  let body = {};

  try {
    body =
      typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  } catch {
    response.status(400).json({ ok: false });
    return;
  }

  const submittedPassword = String(body.password || "");

  if (matches(submittedPassword, configuredPassword)) {
    response.status(200).json({ ok: true });
    return;
  }

  response.status(401).json({
    ok: false,
    message: "That key does not open this archive."
  });
}
