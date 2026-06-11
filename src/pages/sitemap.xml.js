import { siteUrl } from "../data/seo.js";
import { studioLandingPages } from "../data/studioLandingPages.js";
import { vrLandingPages } from "../data/vrLandingPages.js";

export const prerender = true;

const lastmod = "2026-06-11";

const basePages = [
  {
    path: "/",
    priority: "1.0",
    image: "/vr/nova-space-logo.webp",
    imageTitle: "Nova Space Бровари"
  },
  {
    path: "/vr/",
    priority: "0.9",
    image: "/vr/nova-space-logo.webp",
    imageTitle: "NOVA VR Бровари"
  },
  {
    path: "/studio/",
    priority: "0.8",
    image: "/studio/studio-hero.png",
    imageTitle: "Nova PhotoStudio Бровари"
  },
  {
    path: "/booking/",
    priority: "0.6",
    image: "/vr/nova-space-logo.webp",
    imageTitle: "Бронювання Nova Space"
  }
];

const landingPages = [
  ...vrLandingPages.map((page) => ({
    path: `/${page.slug}/`,
    priority: page.slug === "vr-klub-brovary" || page.slug === "den-narodzhennya-vr-brovary" ? "0.85" : "0.8",
    image: page.image,
    imageTitle: page.h1
  })),
  ...studioLandingPages.map((page) => ({
    path: `/${page.slug}/`,
    priority: page.slug === "fotostudiya-brovary" ? "0.85" : page.slug === "simeyna-fotosesiya-brovary" || page.slug === "kontent-zyomka-brovary" ? "0.75" : "0.8",
    image: page.image,
    imageTitle: page.h1
  }))
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const absoluteUrl = (path) => new URL(path, siteUrl).toString();

const renderImage = (page) => {
  if (!page.image) return "";

  return `
    <image:image>
      <image:loc>${escapeXml(absoluteUrl(page.image))}</image:loc>
      <image:title>${escapeXml(page.imageTitle)}</image:title>
    </image:image>`;
};

const renderUrl = (page) => `
  <url>
    <loc>${escapeXml(absoluteUrl(page.path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>${renderImage(page)}
  </url>`;

export function GET() {
  const pages = [...basePages, ...landingPages];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(renderUrl).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
