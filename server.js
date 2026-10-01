import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret-change-me";
const isProduction = process.env.NODE_ENV === "production";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    })
  : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

async function query(text, params = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured.");
  return pool.query(text, params);
}

async function initDb() {
  if (!pool) return;
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(150),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      url TEXT,
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

function clean(value, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

app.get("/api/health", async (_req, res) => {
  let database = "not configured";
  if (pool) {
    try { await query("SELECT 1"); database = "connected"; }
    catch { database = "unavailable"; }
  }
  res.json({ status: "ok", database });
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 255).toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || !email.includes("@") || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email and password of at least 8 characters are required." });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email",
      [name, email, hash]
    );
    const user = result.rows[0];
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "An account with that email already exists." });
    next(err);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = clean(req.body.email, 255).toLowerCase();
    const password = String(req.body.password || "");
    const result = await query("SELECT id,name,email,password_hash FROM users WHERE email=$1", [email]);
    if (!result.rows[0] || !(await bcrypt.compare(password, result.rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const { password_hash, ...user } = result.rows[0];
    res.json({ token: sign(user), user });
  } catch (err) { next(err); }
});

app.get("/api/auth/me", auth, async (req, res, next) => {
  try {
    const result = await query("SELECT id,name,email FROM users WHERE id=$1", [req.user.id]);
    if (!result.rows[0]) return res.status(401).json({ message: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (err) { next(err); }
});

const resources = {
  customers: {
    table: "customers",
    columns: ["name", "email", "phone", "company"],
    required: ["name"]
  },
  tasks: {
    table: "tasks",
    columns: ["title", "description", "status"],
    required: ["title"]
  },
  resources: {
    table: "resources",
    columns: ["title", "url", "category"],
    required: ["title"]
  }
};

for (const [name, cfg] of Object.entries(resources)) {
  app.get(`/api/${name}`, auth, async (req, res, next) => {
    try {
      const result = await query(`SELECT id, ${cfg.columns.join(", ")} FROM ${cfg.table} WHERE user_id=$1 ORDER BY id DESC`, [req.user.id]);
      res.json(result.rows);
    } catch (err) { next(err); }
  });

  app.post(`/api/${name}`, auth, async (req, res, next) => {
    try {
      const values = cfg.columns.map(c => clean(req.body[c], c === "url" ? 1000 : 500));
      if (cfg.required.some((c, i) => !values[cfg.columns.indexOf(c)])) {
        return res.status(400).json({ message: "Please provide all required fields." });
      }
      if (name === "tasks" && !["pending", "in_progress", "completed"].includes(values[2])) {
        return res.status(400).json({ message: "Invalid task status." });
      }
      const placeholders = values.map((_, i) => `$${i + 2}`).join(", ");
      const result = await query(
        `INSERT INTO ${cfg.table} (user_id, ${cfg.columns.join(", ")}) VALUES ($1, ${placeholders}) RETURNING id, ${cfg.columns.join(", ")}`,
        [req.user.id, ...values]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  });

  app.put(`/api/${name}/:id`, auth, async (req, res, next) => {
    try {
      const values = cfg.columns.map(c => clean(req.body[c], c === "url" ? 1000 : 500));
      if (cfg.required.some((c, i) => !values[cfg.columns.indexOf(c)])) {
        return res.status(400).json({ message: "Please provide all required fields." });
      }
      if (name === "tasks" && !["pending", "in_progress", "completed"].includes(values[2])) {
        return res.status(400).json({ message: "Invalid task status." });
      }
      const sets = cfg.columns.map((c, i) => `${c}=$${i + 2}`).join(", ");
      const result = await query(
        `UPDATE ${cfg.table} SET ${sets}, updated_at=NOW() WHERE id=$1 AND user_id=$${values.length + 2} RETURNING id, ${cfg.columns.join(", ")}`,
        [Number(req.params.id), ...values, req.user.id]
      );
      if (!result.rows[0]) return res.status(404).json({ message: "Record not found." });
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  });

  app.delete(`/api/${name}/:id`, auth, async (req, res, next) => {
    try {
      const result = await query(`DELETE FROM ${cfg.table} WHERE id=$1 AND user_id=$2 RETURNING id`, [Number(req.params.id), req.user.id]);
      if (!result.rows[0]) return res.status(404).json({ message: "Record not found." });
      res.status(204).end();
    } catch (err) { next(err); }
  });
}

app.get("/api/dashboard", auth, async (req, res, next) => {
  try {
    const [customers, pending, completed, resources] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM customers WHERE user_id=$1", [req.user.id]),
      query("SELECT COUNT(*)::int AS count FROM tasks WHERE user_id=$1 AND status='pending'", [req.user.id]),
      query("SELECT COUNT(*)::int AS count FROM tasks WHERE user_id=$1 AND status='completed'", [req.user.id]),
      query("SELECT COUNT(*)::int AS count FROM resources WHERE user_id=$1", [req.user.id])
    ]);
    res.json({
      customers: customers.rows[0].count,
      pending: pending.rows[0].count,
      completed: completed.rows[0].count,
      resources: resources.rows[0].count
    });
  } catch (err) { next(err); }
});

if (isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(__dirname + "/dist"));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: isProduction ? "An unexpected server error occurred." : err.message });
});

initDb()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`SMEFlow server running on port ${PORT}`)))
  .catch(err => {
    console.error("Database initialisation failed:", err.message);
    app.listen(PORT, "0.0.0.0", () => console.log(`SMEFlow server running on port ${PORT}; database unavailable until configured.`));
  });
