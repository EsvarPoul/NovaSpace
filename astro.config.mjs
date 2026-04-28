import { defineConfig } from "astro/config";

const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://nova.local");

export default defineConfig({
  output: "static",
  site
});
