import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import swup from "@swup/astro";
import tailwindcss from "@tailwindcss/vite";

const siteUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://health-tech-project.up.railway.app";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  base: "/",
  server: {
    open: '/RAIDL-Health-Tech-Project',
    
 watch: {
        // ✅ Ignore big local model files during dev to prevent the watcher from scanning them
        ignored: ['**/public/models/**'],
        // Optional but helpful when using relative paths for ignored:
        cwd: process.cwd(),
      },

  },
  integrations: [
    swup({
      theme: ["overlay", { direction: "to-top" }],
      cache: true,
      progress: true,
    }),
    preact(),
    sitemap(),
  ],

  image: {
    responsiveStyles: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});



//swup theme variations:
// theme: "fade"
// theme: ["overlay", { direction: "to-top"}]
//
// for overlay and fade, further customization can be done in animate.css file
// To know about swup, visit https://swup.js.org/
