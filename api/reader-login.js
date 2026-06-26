import { findReader, signReaderToken, verifyReaderPassword } from "./_reader-auth.js";

export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false });
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

  const reader = findReader(body.name);

  if (!reader || !verifyReaderPassword(reader, body.password)) {
    response.status(401).json({
      ok: false,
      message: "That reader password did not work."
    });
    return;
  }

  const token = signReaderToken(reader);

  if (!token) {
    response.status(503).json({
      ok: false,
      message: "Reader access is not configured yet."
    });
    return;
  }

  response.status(200).json({
    ok: true,
    token,
    reader: {
      name: reader.name,
      role: reader.role || "reader"
    }
  });
}
