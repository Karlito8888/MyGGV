import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  publicDir: "public",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      manifest: {
        name: "MyGGV",
        short_name: "MyGGV",
        description: "A community-driven platform connecting users through interactive maps, real-time chat, forums, and local services. Share your location, discover nearby services, and engage with your community in a secure and user-friendly environment.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#50aa61",
        orientation: "portrait-primary",
        lang: "en",
        icons: [
          {
            src: "/src/assets/logos/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/src/assets/logos/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/src/assets/logos/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/src/assets/logos/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/src/assets/logos/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/src/assets/logos/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // screenshots: [
        //   {
        //     src: "/screenshots/screenshot1.png",
        //     sizes: "1280x720",
        //     type: "image/png",
        //     label: "Capture d'écran principale",
        //   },
        // ],
        shortcuts: [
          {
            name: "Accueil",
            short_name: "Accueil",
            url: "/",
            icons: [
              {
                src: "/src/assets/logos/icon-192x192.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Profil",
            short_name: "Profil",
            url: "/profile",
            icons: [
              {
                src: "/src/assets/logos/icon-192x192.png",
                sizes: "192x192",
              },
            ],
          }
        ],
        prefer_related_applications: false,
      },
      manifestFilename: "manifest.webmanifest",
      includeManifestIcons: true,
      registerType: "prompt",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|html|json|png|jpg|jpeg|svg|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
      injectRegister: "auto",
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
      includeAssets: ["**/*"],
      strategies: "generateSW",
      minify: true,
      mode: "production",
    }),
  ],
  // server: {
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:8000",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
