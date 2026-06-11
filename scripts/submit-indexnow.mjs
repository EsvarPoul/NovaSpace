import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { siteUrl } from "../src/data/seo.js";

const indexNowKey = "04329b1562807a21488f46f4ce417551";
const indexNowKeyFile = `${indexNowKey}.txt`;
const endpoint = "https://api.indexnow.org/indexnow";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const verifyLiveKey = args.has("--verify-live-key");
const host = new URL(siteUrl).host;
const keyLocation = new URL(`/${indexNowKeyFile}`, siteUrl).toString();

const readSitemapUrls = async () => {
  const sitemap = await readFile(resolve("dist", "sitemap.xml"), "utf8");
  return [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
};

const readLocalKey = async () => {
  const key = (await readFile(resolve("public", indexNowKeyFile), "utf8")).trim();
  if (key !== indexNowKey) {
    throw new Error(`IndexNow key file mismatch: expected ${indexNowKey}, found ${key}`);
  }
};

const verifyLiveKeyFile = async () => {
  const response = await fetch(keyLocation, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`IndexNow key file is not live: ${response.status} ${response.statusText}`);
  }

  const key = (await response.text()).trim();
  if (key !== indexNowKey) {
    throw new Error(`Live IndexNow key mismatch: expected ${indexNowKey}, found ${key}`);
  }
};

await readLocalKey();
if (verifyLiveKey) await verifyLiveKeyFile();

const urlList = await readSitemapUrls();
if (!urlList.length) throw new Error("No URLs found in dist/sitemap.xml");

const payload = {
  host,
  key: indexNowKey,
  keyLocation,
  urlList
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  console.log(`IndexNow dry run: ${urlList.length} URLs ready.`);
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(payload)
});
const body = await response.text();

if (!response.ok) {
  throw new Error(`IndexNow submit failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with status ${response.status}.`);
