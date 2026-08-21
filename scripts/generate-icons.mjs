import sharp from "sharp";
import { mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const iconsDir = join(publicDir, "icons");

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Read the SVG source
const svgPath = join(publicDir, "homebrew.svg");
const svgBuffer = readFileSync(svgPath);

// Keep the complete artwork inside the platform-safe area used by installed
// app icons. The source SVG is portrait-oriented, so square `cover` resizing
// would crop the top and bottom of the beer glass.
const iconArtworkScale = 0.8;

// Icon sizes to generate
const sizes = [
  { size: 16, name: "icon-16.png" },
  { size: 32, name: "icon-32.png" },
  { size: 48, name: "icon-48.png" },
  { size: 72, name: "icon-72.png" },
  { size: 96, name: "icon-96.png" },
  { size: 128, name: "icon-128.png" },
  { size: 144, name: "icon-144.png" },
  { size: 150, name: "icon-150.png" }, // MS Tile
  { size: 152, name: "icon-152.png" },
  { size: 180, name: "apple-touch-icon.png" }, // Apple Touch Icon
  { size: 192, name: "icon-192.png" }, // PWA
  { size: 384, name: "icon-384.png" },
  { size: 512, name: "icon-512.png" }, // PWA
];

console.log("Generating icons from homebrew.svg...\n");

for (const { size, name } of sizes) {
  const outputPath = join(iconsDir, name);
  const artworkSize = Math.round(size * iconArtworkScale);
  const artwork = await sharp(svgBuffer)
    .resize(artworkSize, artworkSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artwork, gravity: "center" }])
    .png()
    .toFile(outputPath);
  console.log(`✓ Generated ${name} (${size}x${size})`);
}

// Generate OG image (1200x630)
const ogImagePath = join(publicDir, "og-image.png");
const ogWidth = 1200;
const ogHeight = 630;
const iconSize = 200;

// Create OG image with background and centered icon
const ogBackground = await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a
  },
})
  .png()
  .toBuffer();

const iconForOg = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer();

// Create text overlay as SVG
const textSvg = Buffer.from(`
  <svg width="${ogWidth}" height="${ogHeight}">
    <style>
      .title { fill: #f97316; font-size: 72px; font-family: system-ui, sans-serif; font-weight: bold; }
      .subtitle { fill: #a1a1aa; font-size: 32px; font-family: system-ui, sans-serif; }
    </style>
    <text x="${ogWidth / 2}" y="${ogHeight / 2 + 60}" text-anchor="middle" class="title">Brew Graph</text>
    <text x="${ogWidth / 2}" y="${ogHeight / 2 + 110}" text-anchor="middle" class="subtitle">Homebrew Package Explorer</text>
  </svg>
`);

await sharp(ogBackground)
  .composite([
    {
      input: iconForOg,
      top: Math.floor((ogHeight - iconSize) / 2 - 80),
      left: Math.floor((ogWidth - iconSize) / 2),
    },
    {
      input: textSvg,
      top: 0,
      left: 0,
    },
  ])
  .toFile(ogImagePath);

console.log(`\n✓ Generated og-image.png (${ogWidth}x${ogHeight})`);

console.log("\n✅ All icons generated successfully!");
