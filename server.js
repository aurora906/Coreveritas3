require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const Stripe = require("stripe");

const app = express();
const rootPath = __dirname;
const dataPath = path.join(rootPath, "data");
const uploadPath = path.join(dataPath, "uploads");
const entriesPath = path.join(dataPath, "content.json");
const sessionCookie = "coreveritas_admin";
const sessionDuration = 8 * 60 * 60 * 1000;
const maximumUploadSize = 50 * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".epub", ".mobi", ".azw3", ".docx", ".txt", ".rtf", ".zip"]);
if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET || !process.env.STRIPE_SECRET_KEY)) {
  throw new Error("Production requires ADMIN_PASSWORD, SESSION_SECRET, and STRIPE_SECRET_KEY.");
}
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const starterEntries = [
  {
    id: "start-01",
    type: "Buch",
    title: "Die Wahrheit, die du kennst",
    excerpt: "Ein Anfang dort, wo du aufgehört hast, dir selbst auszuweichen.",
    body: "Es gibt einen Moment, in dem die Erklärung nicht mehr trägt. Du kennst ihn.\n\nDieses Buch handelt nicht davon, dich neu zu erfinden. Es handelt davon, wieder hinzusehen: auf das, was du weißt, auf das, was du brauchst, und auf alles, was du viel zu lange klein geredet hast.\n\nKlarheit ist kein lauter Entschluss. Manchmal ist sie nur der erste ehrliche Satz.",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
    date: "Ein Gedanke zum Bleiben",
    priceCents: 0,
    file: null
  },
  {
    id: "start-02",
    type: "Artikel",
    title: "Wenn dein Schweigen schwerer wird",
    excerpt: "Nicht jedes Schweigen ist Frieden. Manches ist nur der Preis, den du zahlst, um niemanden zu enttäuschen.",
    body: "Du hast gelernt, den richtigen Moment abzuwarten. Den richtigen Ton. Die richtige Formulierung, die niemanden erschreckt.\n\nUnd während du wartest, wird das Ungesagte nicht kleiner. Es sitzt mit am Tisch. Es fährt mit nach Hause. Es entscheidet mit, was du dir noch erlaubst.\n\nDu musst nicht alles heute aussprechen. Aber du darfst aufhören, so zu tun, als wäre nichts da.",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80",
    date: "Ein Text über Grenzen",
    priceCents: 0,
    file: null
  },
  {
    id: "start-03",
    type: "Artikel",
    title: "Du schuldest nicht jedem eine Erklärung",
    excerpt: "Eine Grenze wird nicht erst gültig, wenn alle sie verstehen.",
    body: "Du darfst Nein sagen, bevor du erschöpft bist. Du darfst gehen, bevor du beweisen kannst, dass es schlimm genug war.\n\nNicht jede Grenze braucht eine Verhandlung. Nicht jede Entscheidung muss von den Menschen abgesegnet werden, die mit ihr nicht leben müssen.\n\nDein Nein ist kein Angriff. Es ist eine Information darüber, wo du aufhörst, dich selbst zu verlassen.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    date: "Ein Text über Selbstachtung",
    priceCents: 0,
    file: null
  },
  {
    id: "start-04",
    type: "Buch",
    title: "Was bleibt, wenn du aufhörst",
    excerpt: "Über Rollen, die nicht mehr passen, und über das Leben dahinter.",
    body: "Du warst verlässlich. Vernünftig. Die Person, die es schon irgendwie richtet. Vielleicht warst du darin gut. Vielleicht warst du darin vor allem allein.\n\nAufhören bedeutet nicht, dass alles umsonst war. Es bedeutet, dass du nicht mehr jede alte Rolle mit in deine Zukunft nehmen musst.\n\nWas bleibt, wenn du aufhörst? Vielleicht zum ersten Mal: du.",
    image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    date: "Ein Buch über Veränderung",
    priceCents: 0,
    file: null
  }
];

fs.mkdirSync(uploadPath, { recursive: true });

function writeEntries(entries) {
  const temporaryPath = entriesPath + ".tmp";
  fs.writeFileSync(temporaryPath, JSON.stringify(entries, null, 2));
  fs.renameSync(temporaryPath, entriesPath);
}

function loadEntries() {
  if (!fs.existsSync(entriesPath)) {
    writeEntries(starterEntries);
    return [...starterEntries];
  }
  try {
    const entries = JSON.parse(fs.readFileSync(entriesPath, "utf8"));
    return Array.isArray(entries) ? entries : [...starterEntries];
  } catch {
    return [...starterEntries];
  }
}

let entries = loadEntries();

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionToken(expiresAt) {
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.SESSION_SECRET || "coreveritas-local-development-secret").update(payload).digest("base64url");
  return payload + "." + signature;
}

function hasAdminSession(request) {
  const cookieHeader = request.headers.cookie || "";
  const tokenPart = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(sessionCookie + "="));
  if (!tokenPart) return false;
  let token;
  try {
    token = decodeURIComponent(tokenPart.slice(sessionCookie.length + 1));
  } catch {
    return false;
  }
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expectedSignature = crypto.createHmac("sha256", process.env.SESSION_SECRET || "coreveritas-local-development-secret").update(payload).digest("base64url");
  if (!safeEqual(signature, expectedSignature)) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).expiresAt > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(request, response, next) {
  if (!hasAdminSession(request)) return response.status(401).json({ error: "Bitte melde dich erneut an." });
  next();
}

function getEntry(id) {
  return entries.find((entry) => entry.id === id);
}

function toPublicEntry(entry) {
  const { file, body, ...metadata } = entry;
  return {
    ...metadata,
    body: entry.priceCents > 0 && file ? "" : body,
    attachmentName: file ? file.originalName : null
  };
}

function parsePrice(value) {
  const normalized = String(value ?? "0").trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const priceCents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(priceCents) ? priceCents : null;
}

function removeUploadedFile(file) {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadPath),
  filename: (_request, file, callback) => callback(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
});

const upload = multer({
  storage,
  limits: { fileSize: maximumUploadSize, files: 1 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) return callback(new Error("Dieser Dateityp wird nicht unterstützt."));
    callback(null, true);
  }
});

const loginAttempts = new Map();
app.disable("x-powered-by");
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json({ limit: "64kb" }));

app.get("/", (_request, response) => response.sendFile(path.join(rootPath, "index.html")));
app.get(["/index.html", "/articles.html", "/admin.html", "/style.css", "/script.js", "/logo.jpg", "/walpaper.jpg"], (request, response) => {
  response.sendFile(path.join(rootPath, path.basename(request.path)));
});

app.get("/api/entries", (_request, response) => {
  response.json(entries.map(toPublicEntry));
});

app.get("/api/admin/session", (request, response) => {
  response.json({ authenticated: hasAdminSession(request) });
});

app.post("/api/admin/login", (request, response) => {
  const now = Date.now();
  const address = request.ip;
  const recentAttempts = (loginAttempts.get(address) || []).filter((timestamp) => now - timestamp < 15 * 60 * 1000);
  if (recentAttempts.length >= 10) return response.status(429).json({ error: "Zu viele Versuche. Bitte warte einen Moment." });
  recentAttempts.push(now);
  loginAttempts.set(address, recentAttempts);

  const adminPassword = process.env.ADMIN_PASSWORD || "coreveritas2026";
  if (!safeEqual(request.body.password || "", adminPassword)) return response.status(401).json({ error: "Das Passwort ist nicht korrekt." });

  loginAttempts.delete(address);
  const token = createSessionToken(now + sessionDuration);
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: sessionDuration,
    path: "/"
  });
  response.json({ authenticated: true });
});

app.post("/api/admin/logout", requireAdmin, (_request, response) => {
  response.clearCookie(sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/" });
  response.json({ authenticated: false });
});

app.post("/api/admin/entries", requireAdmin, upload.single("file"), (request, response) => {
  const uploadedFile = request.file;
  const { type, title, excerpt, body = "" } = request.body;
  const priceCents = parsePrice(request.body.price);
  if (!["Buch", "Artikel"].includes(type) || !title?.trim() || !excerpt?.trim() || (!body.trim() && !uploadedFile) || priceCents === null) {
    removeUploadedFile(uploadedFile);
    return response.status(400).json({ error: "Bitte prüfe Format, Titel, Kurztext, Inhalt und Preis." });
  }
  if (priceCents > 0 && !uploadedFile) {
    return response.status(400).json({ error: "Für kostenpflichtige Veröffentlichungen ist eine Datei erforderlich." });
  }

  const entry = {
    id: crypto.randomUUID(),
    type,
    title: title.trim().slice(0, 100),
    excerpt: excerpt.trim().slice(0, 240),
    body: body.trim(),
    date: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date()),
    priceCents,
    file: uploadedFile ? {
      storedName: uploadedFile.filename,
      originalName: path.basename(uploadedFile.originalname).replace(/[\r\n]/g, "").slice(0, 180),
      size: uploadedFile.size
    } : null
  };
  entries.unshift(entry);
  writeEntries(entries);
  response.status(201).json(toPublicEntry(entry));
});

app.delete("/api/admin/entries/:id", requireAdmin, (request, response) => {
  const index = entries.findIndex((entry) => entry.id === request.params.id);
  if (index === -1) return response.status(404).json({ error: "Diese Veröffentlichung wurde nicht gefunden." });
  const [removed] = entries.splice(index, 1);
  if (removed.file) removeUploadedFile({ path: path.join(uploadPath, removed.file.storedName) });
  writeEntries(entries);
  response.json({ deleted: true });
});

app.post("/api/checkout/:id", async (request, response) => {
  const entry = getEntry(request.params.id);
  if (!entry || !entry.file || entry.priceCents < 1) return response.status(404).json({ error: "Diese Veröffentlichung kann nicht gekauft werden." });
  if (!stripe) return response.status(503).json({ error: "Der Kartenkauf ist noch nicht eingerichtet." });

  try {
    const baseUrl = process.env.APP_BASE_URL || request.protocol + "://" + request.get("host");
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: entry.priceCents,
          product_data: { name: entry.title, description: entry.excerpt.slice(0, 500) }
        }
      }],
      metadata: { productId: entry.id },
      success_url: baseUrl + "/articles.html?session_id={CHECKOUT_SESSION_ID}&product_id=" + encodeURIComponent(entry.id),
      cancel_url: baseUrl + "/articles.html?abgebrochen=1"
    });
    response.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe checkout could not be created:", error.message);
    response.status(502).json({ error: "Der Bezahlvorgang konnte gerade nicht gestartet werden." });
  }
});

app.get("/api/download/:id", async (request, response) => {
  const entry = getEntry(request.params.id);
  if (!entry || !entry.file) return response.status(404).json({ error: "Diese Datei wurde nicht gefunden." });
  if (entry.priceCents > 0) {
    if (!stripe || !request.query.session_id) return response.status(403).json({ error: "Für diesen Download ist ein bestätigter Kauf erforderlich." });
    try {
      const checkout = await stripe.checkout.sessions.retrieve(String(request.query.session_id));
      const purchaseConfirmed = checkout.payment_status === "paid"
        && checkout.mode === "payment"
        && checkout.metadata.productId === entry.id
        && checkout.currency === "eur"
        && checkout.amount_total === entry.priceCents;
      if (!purchaseConfirmed) return response.status(403).json({ error: "Die Zahlung konnte nicht bestätigt werden." });
    } catch {
      return response.status(403).json({ error: "Die Zahlung konnte nicht bestätigt werden." });
    }
  }

  const storedPath = path.join(uploadPath, path.basename(entry.file.storedName));
  if (!storedPath.startsWith(uploadPath + path.sep) || !fs.existsSync(storedPath)) {
    return response.status(404).json({ error: "Die Datei ist momentan nicht verfügbar." });
  }
  response.setHeader("Cache-Control", "private, no-store");
  response.download(storedPath, entry.file.originalName, (error) => {
    if (error && !response.headersSent) response.status(500).json({ error: "Der Download konnte nicht gestartet werden." });
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Die Datei darf höchstens 50 MB groß sein." : "Die Datei konnte nicht verarbeitet werden.";
    return response.status(400).json({ error: message });
  }
  if (error.message === "Dieser Dateityp wird nicht unterstützt.") return response.status(400).json({ error: error.message });
  console.error("Request failed:", error);
  response.status(500).json({ error: "Ein unerwarteter Fehler ist aufgetreten." });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("COREVERITAS is running at http://localhost:" + port);
  if (!stripe) console.log("Stripe is not configured. Free downloads are available; paid checkout is disabled.");
});
