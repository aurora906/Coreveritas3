const fs = require("node:fs");
const path = require("node:path");

const rootPath = __dirname;
const outputPath = path.join(rootPath, "dist");
const publicFiles = ["index.html", "articles.html", "admin.html", "style.css", "script.js", "logo.jpg", "walpaper.jpg"];

fs.rmSync(outputPath, { recursive: true, force: true });
fs.mkdirSync(outputPath, { recursive: true });

for (const fileName of publicFiles) {
  fs.copyFileSync(path.join(rootPath, fileName), path.join(outputPath, fileName));
}

console.log("Built COREVERITAS static site in dist/");
