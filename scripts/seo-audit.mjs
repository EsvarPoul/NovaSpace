import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const siteUrl = "https://nova-space.pp.ua";
const distDir = resolve("dist");
const expectedUrlCount = 15;
const publicPages = [
  "/",
  "/brovary/",
  "/vr/",
  "/studio/",
  "/booking/",
  "/vr-klub-brovary/",
  "/den-narodzhennya-vr-brovary/",
  "/korporatyv-vr-brovary/",
  "/vr-dlya-ditey-brovary/",
  "/ps5-brovary/",
  "/fotostudiya-brovary/",
  "/orenda-fotostudiyi-brovary/",
  "/fotosesiya-brovary/",
  "/simeyna-fotosesiya-brovary/",
  "/kontent-zyomka-brovary/"
];

const requiredSchemaTypes = {
  "/": ["Organization", "WebSite", "CollectionPage"],
  "/brovary/": ["Organization", "WebSite", "LocalBusiness", "CollectionPage", "BreadcrumbList"],
  "/vr/": ["Organization", "WebSite", "LocalBusiness", "WebPage", "BreadcrumbList", "FAQPage"],
  "/studio/": ["Organization", "WebSite", "LocalBusiness", "WebPage", "BreadcrumbList"],
  "/booking/": ["Organization", "WebSite", "WebPage", "BreadcrumbList"]
};

const landingSchemaTypes = ["Organization", "WebSite", "LocalBusiness", "WebPage", "Service", "BreadcrumbList", "FAQPage"];

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const pageFilePath = (path) => {
  if (path === "/") return join(distDir, "index.html");
  return join(distDir, path.replace(/^\/|\/$/g, ""), "index.html");
};

const readPage = async (path) => {
  const file = pageFilePath(path);
  assert(existsSync(file), `Missing generated page for ${path}: ${file}`);
  return readFile(file, "utf8");
};

const absoluteUrl = (path) => new URL(path, siteUrl).toString();

const matchAttribute = (html, selector) => {
  const match = html.match(selector);
  return match ? match[1] : "";
};

const parseSchemas = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [parsed];
  });

const getTypes = (schemas) => schemas.map((schema) => schema["@type"]);

const findSchemas = (schemas, type) => schemas.filter((schema) => schema["@type"] === type);

const assertTypes = (path, schemas, expectedTypes) => {
  const types = getTypes(schemas);
  for (const type of expectedTypes) {
    assert(types.includes(type), `${path} is missing ${type} schema`);
  }
};

const assertBreadcrumbIncludesBrovary = (path, schemas) => {
  const breadcrumb = findSchemas(schemas, "BreadcrumbList")[0];
  assert(breadcrumb, `${path} is missing BreadcrumbList schema`);
  const items = breadcrumb.itemListElement?.map((item) => item.item) || [];
  assert(items.includes(`${siteUrl}/brovary/`), `${path} breadcrumb does not include /brovary/`);
};

const assertLocalBusinessesHaveGeo = (path, schemas) => {
  for (const business of findSchemas(schemas, "LocalBusiness")) {
    assert(business.geo?.latitude && business.geo?.longitude, `${path} LocalBusiness is missing geo coordinates`);
  }
};

const assertLocalBusinessesHaveMedia = (path, schemas) => {
  for (const business of findSchemas(schemas, "LocalBusiness")) {
    const images = Array.isArray(business.image) ? business.image : [business.image].filter(Boolean);
    const photos = Array.isArray(business.photo) ? business.photo : [business.photo].filter(Boolean);
    const amenities = Array.isArray(business.amenityFeature) ? business.amenityFeature : [];

    assert(images.length >= 2, `${path} LocalBusiness should expose multiple images`);
    assert(photos.length >= 2, `${path} LocalBusiness should expose multiple photos`);
    assert(amenities.length >= 2, `${path} LocalBusiness should expose amenityFeature entries`);
  }
};

const readSitemapUrls = async () => {
  const sitemap = await readFile(join(distDir, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const pageUrls = urls.filter((url) => !url.match(/\.(webp|png|jpg|jpeg|svg)$/i));
  return { sitemap, pageUrls };
};

const auditRobots = async () => {
  const robots = await readFile(join(distDir, "robots.txt"), "utf8");
  assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots.txt is missing the sitemap directive");
};

const auditSitemap = async () => {
  const { sitemap, pageUrls } = await readSitemapUrls();
  assert(pageUrls.length === expectedUrlCount, `Expected ${expectedUrlCount} sitemap page URLs, found ${pageUrls.length}`);
  assert(new Set(pageUrls).size === pageUrls.length, "Sitemap has duplicate page URLs");
  assert(!sitemap.includes("/admin/"), "Sitemap must not include admin pages");

  for (const path of publicPages) {
    assert(pageUrls.includes(absoluteUrl(path)), `Sitemap is missing ${path}`);
  }
};

const auditPage = async (path) => {
  const html = await readPage(path);
  const canonical = matchAttribute(html, /<link rel="canonical" href="([^"]+)"/);
  const description = matchAttribute(html, /<meta name="description" content="([^"]+)"/);
  const robots = matchAttribute(html, /<meta name="robots" content="([^"]+)"/);
  const schemas = parseSchemas(html);

  assert(canonical === absoluteUrl(path), `${path} canonical mismatch: ${canonical}`);
  assert(description.length >= 80, `${path} meta description is too short`);
  assert(robots === "index,follow", `${path} robots meta should be index,follow`);
  assert(html.includes(`<link rel="alternate" hreflang="uk-UA" href="${canonical}"`), `${path} is missing uk-UA hreflang`);
  assert(html.includes(`<link rel="icon" href="/vr/nova-space-logo.svg"`), `${path} is missing SVG favicon`);
  assert(html.includes(`<meta name="theme-color" content="#050711"`), `${path} is missing theme-color`);
  assert(html.includes(`<meta property="og:image:alt"`), `${path} is missing og:image:alt`);
  assert(html.includes(`<meta name="geo.position" content="50.49937;30.77804"`), `${path} is missing geo.position`);
  assert(!html.includes("Точну адресу можна додати"), `${path} contains old placeholder address FAQ text`);
  assert((html.match(/id="contacts"/g) || []).length <= 1, `${path} has duplicate contacts ids`);

  const expected = requiredSchemaTypes[path] || landingSchemaTypes;
  assertTypes(path, schemas, expected);
  assertLocalBusinessesHaveGeo(path, schemas);
  assertLocalBusinessesHaveMedia(path, schemas);

  if (path !== "/") assertBreadcrumbIncludesBrovary(path, schemas);
  if (path.includes("fotostudiya")) assert(!html.includes('href="/vr/#sessions"'), `${path} studio CTA still links to VR sessions`);

  return {
    path,
    schemaTypes: getTypes(schemas)
  };
};

await auditRobots();
await auditSitemap();
const reports = [];

for (const path of publicPages) {
  reports.push(await auditPage(path));
}

console.log(`SEO audit passed for ${reports.length} public pages and ${expectedUrlCount} sitemap URLs.`);
