import {
  findReader,
  getReaderConfigStatus,
  signReaderToken,
  verifyReaderPassword
} from "./_reader-auth.js";

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

  const submittedName = String(body.name || "").trim();
  const reader = findReader(submittedName);
  const readerConfig = getReaderConfigStatus();

  console.info("[reading-room] reader login attempt", {
    hasReadersEnv: readerConfig.hasReadersEnv,
    readerCount: readerConfig.readerCount,
    submittedName,
    readerMatched: Boolean(reader)
  });

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
