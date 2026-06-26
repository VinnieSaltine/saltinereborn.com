import crypto from "node:crypto";

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseReaders() {
  const raw = process.env.READING_ROOM_READERS || "[]";

  try {
    const readers = JSON.parse(raw);
    return Array.isArray(readers) ? readers : [];
  } catch {
    return [];
  }
}

function getTokenSecret() {
  return (
    process.env.READING_ROOM_TOKEN_SECRET ||
    process.env.SITE_PASSWORD ||
    process.env.SALTINE_REBORN_PASSWORD ||
    ""
  );
}

export function findReader(name) {
  const normalizedName = String(name || "").trim().toLowerCase();

  return parseReaders().find((reader) => {
    return String(reader.name || "").trim().toLowerCase() === normalizedName;
  });
}

export function verifyReaderPassword(reader, password) {
  const submitted = String(password || "");

  if (!reader || !submitted) {
    return false;
  }

  if (reader.passwordHash) {
    return hash(submitted) === String(reader.passwordHash);
  }

  return submitted === String(reader.password || "");
}

export function signReaderToken(reader) {
  const secret = getTokenSecret();

  if (!secret) {
    return null;
  }

  const payload = {
    name: reader.name,
    role: reader.role || "reader",
    issuedAt: Date.now()
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyReaderToken(token) {
  const secret = getTokenSecret();
  const [encodedPayload, signature] = String(token || "").split(".");

  if (!secret || !encodedPayload || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  const submitted = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    submitted.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(submitted, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return findReader(payload.name) ? payload : null;
  } catch {
    return null;
  }
}

export function readBearerToken(request) {
  const authorization = request.headers.authorization || request.headers.Authorization || "";
  const [scheme, token] = String(authorization).split(" ");

  return scheme === "Bearer" ? token : "";
}
