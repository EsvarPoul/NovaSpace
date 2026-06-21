import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "https://nova-space.pp.ua";

export default defineConfig({
  output: "static",
  site
});
