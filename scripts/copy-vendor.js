// Copies browser libraries from node_modules into public/vendor (run on install).
import fs from "node:fs";

fs.mkdirSync("public/vendor", { recursive: true });
fs.copyFileSync("node_modules/marked/lib/marked.esm.js", "public/vendor/marked.esm.js");
console.log("vendor: copied marked.esm.js");
