/**
 * Ensures DATABASE_URL is set and valid before Prisma runs.
 * Fixes common Vercel issues: extra quotes, whitespace.
 * Writes a clean .env so Prisma (next command) gets the correct value.
 */
const fs = require("fs");
const path = require("path");

let url = process.env.DATABASE_URL;

if (url == null || url === "") {
  console.error("\n❌ DATABASE_URL is not set.");
  console.error("   On Vercel: Settings → Environment Variables → add DATABASE_URL");
  console.error("   Value: paste your Neon connection string (no quotes).\n");
  process.exit(1);
}

// Trim and remove surrounding quotes (common when pasting from .env)
url = String(url).trim();
if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
  url = url.slice(1, -1).trim();
}

if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error("\n❌ DATABASE_URL must start with postgresql:// or postgres://");
  console.error("   First 60 chars received:", JSON.stringify(url.slice(0, 60)));
  console.error("   Check for extra quotes or spaces in Vercel Environment Variables.\n");
  process.exit(1);
}

// Write clean value to .env so prisma generate / db push see it (fixes quoted value from Vercel)
const envPath = path.join(process.cwd(), ".env");
const envLine = `DATABASE_URL=${url}\n`;
fs.writeFileSync(envPath, envLine, "utf8");
console.log("✓ DATABASE_URL is valid (cleaned and written for Prisma)");
