import { siteUrl } from "../data/seo.js";
import { studioLandingPages } from "../data/studioLandingPages.js";
import { vrLandingPages } from "../data/vrLandingPages.js";

export const prerender = true;

const lastmod = "2026-06-12";

const basePages = ["/", "/brovary/", "/vr/", "/studio/", "/booking/"];
const landingPages = [
  ...vrLandingPages.map((page) => `/${page.slug}/`),
  ...studioLandingPages.map((page) => `/${page.slug}/`)
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const absoluteUrl = (path) => new URL(path, siteUrl).toString();

const renderUrl = (path) => `  <url>
    <loc>${escapeXml(absoluteUrl(path))}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;

export function GET() {
  const pages = [...basePages, ...landingPages];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(renderUrl).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
