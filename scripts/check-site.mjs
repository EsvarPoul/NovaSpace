import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const required = [
  "astro.config.mjs",
  "tsconfig.json",
  "src/pages/index.astro",
  "src/pages/studio/index.astro",
  "src/pages/vr/index.astro",
  "src/layouts/BaseLayout.astro",
  "src/components/gateway/SplitGateway.astro",
  "src/components/studio/StudioHero.astro",
  "src/components/vr/VRHero.astro",
  "src/styles/globals.css"
];

for (const file of required) {
  await access(resolve(root, file));
}

const pages = await Promise.all(["src/pages/index.astro", "src/pages/studio/index.astro", "src/pages/vr/index.astro"].map(async (file) => {
  const source = await readFile(resolve(root, file), "utf8");
  if (!source.includes("BaseLayout")) {
    throw new Error(`${file} is missing the shared BaseLayout.`);
  }
  return file;
}));

console.log(`Nova Astro structure check passed: ${pages.join(", ")}`);
