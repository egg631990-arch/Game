const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const FOLDERS = ["css", "js", "img"];
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "games.json");

const MIME = {
".html": "text/html; charset=utf-8",
".css": "text/css; charset=utf-8",
".js": "text/javascript; charset=utf-8",
".json": "application/json; charset=utf-8",
".png": "image/png",
".jpg": "image/jpeg",
".jpeg": "image/jpeg",
".webp": "image/webp",
".svg": "image/svg+xml",
".ico": "image/x-icon"
};

function load() {
try {
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
if (data && Array.isArray(data.games)) {
return data;
}
} catch (e) {}
return { nextId: 1, games: [] };
}

function save(data) {
fs.mkdirSync(DATA_DIR, { recursive: true });
const tmp = DATA_FILE + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(data));
fs.renameSync(tmp, DATA_FILE);
}

function send(res, status, body) {
res.writeHead(status, {
"Content-Type": "application/json; charset=utf-8",
"Cache-Control": "no-store"
});
res.end(JSON.stringify(body));
}

function readBody(req) {
return new Promise((resolve) => {
let s = "";
req.on("data", (c) => {
s += c;
if (s.length > 100000) {
req.destroy();
}
});
req.on("end", () => {
try {
resolve(JSON.parse(s || "{}"));
} catch (e) {
resolve({});
}
});
req.on("error", () => resolve({}));
});
}

function cleanUser(u) {
if (!u || u.id === undefined || u.id === null) {
return null;
}
return {
id: String(u.id).slice(0, 64),
name: String(u.name || "user").slice(0, 64),
photo: typeof u.photo === "string" && /^https:\/\//.test(u.photo) ? u.photo.slice(0, 500) : null
};
}

async function handleApi(req, res, p) {
const parts = p.split("/").filter(Boolean);

if (parts.length === 2 && req.method === "GET") {
return send(res, 200, load().games);
}

if (parts.length === 2 && req.method === "POST") {
const body = await readBody(req);
const o = body.opts || {};
const user = cleanUser(body.user);
const rules = ["Подкидной", "Переводной"].includes(o.rules) ? o.rules : null;
const deck = [24, 36, 52].includes(Number(o.deck)) ? Number(o.deck) : null;
const maxPlayers = Number(o.maxPlayers);
const bet = Number(o.bet);
if (!user || !rules || !deck || !Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 6 || !Number.isInteger(bet) || bet < 100) {
return send(res, 400, { error: "bad request" });
}
const data = load();
const game = {
id: data.nextId,
rules: rules,
deck: deck,
maxPlayers: maxPlayers,
bet: bet,
creatorId: user.id,
players: [user]
};
data.nextId += 1;
data.games.push(game);
save(data);
return send(res, 200, game);
}

const id = parseInt(parts[2], 10);
if (parts[1] !== "games" || !Number.isInteger(id)) {
return send(res, 404, { error: "not found" });
}

const data = load();
const game = data.games.find((g) => g.id === id);

if (parts.length === 3 && req.method === "GET") {
return game ? send(res, 200, game) : send(res, 404, { error: "not found" });
}

if (parts.length === 4 && req.method === "POST" && parts[3] === "join") {
const body = await readBody(req);
const user = cleanUser(body.user);
if (!game) {
return send(res, 404, { error: "not found" });
}
if (!user) {
return send(res, 400, { error: "bad request" });
}
if (!game.players.some((p2) => p2.id === user.id)) {
if (game.players.length >= game.maxPlayers) {
return send(res, 409, { error: "full" });
}
game.players.push(user);
save(data);
}
return send(res, 200, game);
}

if (parts.length === 4 && req.method === "POST" && parts[3] === "leave") {
const body = await readBody(req);
const userId = String(body.userId === undefined ? "" : body.userId);
if (!game) {
return send(res, 200, { ok: true });
}
if (game.creatorId === userId) {
data.games = data.games.filter((g) => g.id !== id);
} else {
game.players = game.players.filter((p2) => p2.id !== userId);
}
save(data);
return send(res, 200, { ok: true });
}

return send(res, 404, { error: "not found" });
}

function serveStatic(req, res, p) {
if (req.method !== "GET" && req.method !== "HEAD") {
res.writeHead(405);
res.end();
return;
}
let rel;
try {
rel = decodeURIComponent(p);
} catch (e) {
res.writeHead(400);
res.end();
return;
}
if (rel.endsWith("/")) {
rel += "index.html";
}
const file = path.join(ROOT, rel);
const segs = path.relative(ROOT, file).split(path.sep);
const allowed = segs.length === 1 ? segs[0].endsWith(".html") : FOLDERS.includes(segs[0]);
if (!file.startsWith(ROOT + path.sep) || !allowed) {
res.writeHead(403);
res.end();
return;
}
fs.readFile(file, (err, buf) => {
if (err) {
res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
res.end("404");
return;
}
res.writeHead(200, {
"Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
"Cache-Control": "no-cache"
});
res.end(req.method === "HEAD" ? undefined : buf);
});
}

http.createServer((req, res) => {
const p = new URL(req.url, "http://localhost").pathname;
if (p.startsWith("/api/")) {
handleApi(req, res, p).catch(() => send(res, 500, { error: "server error" }));
return;
}
serveStatic(req, res, p);
}).listen(PORT);
