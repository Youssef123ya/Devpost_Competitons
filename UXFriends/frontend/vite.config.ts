import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "axios",
      "sonner",
      "lucide-react",
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/App.tsx",
        "./src/styles/globals.css",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "react-vendor";
          }

          if (id.includes("axios") || id.includes("sonner")) {
            return "app-vendor";
          }

          if (id.includes("html2canvas")) {
            return "pdf-html2canvas";
          }

          if (id.includes("jspdf")) {
            return "pdf-jspdf";
          }

          return "vendor";
        },
      },
    },
  },
});
