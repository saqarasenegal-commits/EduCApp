// Vercel serverless entry: all /api/* requests are rewritten here (see vercel.json).
// Static files in /public are served directly by Vercel's CDN.
export { default } from "../server/app.js";
