import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { archivePathFor } from "../src/image-archive.js";

const root = new URL("../", import.meta.url);
const railroadFiles = (await readFile(new URL("data/railroads/index.json", root), "utf8"));
const railroadIds = JSON.parse(railroadFiles).railroads;
const files = ["data/locomotives.json", "data/collection.json", "data/orders.json", "data/historical-locomotives.json",
  ...railroadIds.map((id) => `data/railroads/${id}.json`)];
const urls = new Set();
function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (["remoteImageUrl", "src"].includes(key) && typeof entry === "string" && /^https?:\/\//.test(entry)) urls.add(entry);
    else collect(entry);
  }
}
for (const file of files) collect(JSON.parse(await readFile(new URL(file, root), "utf8")));

const destination = new URL("WebArchive/external/", root);
await mkdir(destination, { recursive: true });
const failures = [];
for (const url of urls) {
  const relativePath = archivePathFor(url).slice(1);
  const target = new URL(relativePath, root);
  try {
    if ((await stat(target).catch(() => null))?.size > 0) continue;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AmericanDieselRoster/1.0)" }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const valid = (bytes[0] === 0xff && bytes[1] === 0xd8)
      || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
      || (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)
      || (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP");
    if (!valid) throw new Error("Response is not an image");
    await writeFile(target, bytes);
    console.log(`Saved ${relativePath} (${bytes.length} bytes)`);
  } catch (error) {
    failures.push({ url, reason: error.message });
    console.error(`Failed ${url}: ${error.message}`);
  }
}
console.log(`Archived ${urls.size - failures.length}/${urls.size} external images.`);
if (failures.length) process.exitCode = 1;
