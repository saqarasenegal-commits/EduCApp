// Local server: serves the static frontend and the API.
import express from "express";
import path from "node:path";
import { app } from "./app.js";
import { kind } from "./store.js";
import { authEnabled } from "./auth.js";
import { MODEL } from "./ai.js";

const server = express();
server.use(express.static(path.resolve("public")));
server.use(app);

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`EduCApp AI tutor running on http://localhost:${PORT}`);
  console.log(`  model: ${MODEL} | storage: ${kind} | access code: ${authEnabled() ? "on" : "off"}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠ ANTHROPIC_API_KEY is not set — copy .env.example to .env and add your key.");
  }
});
