import { defineConfig } from "@neon/config/v1";

// RxFlow uses Neon for Postgres only — the app is hosted on Netlify and keeps
// its own Auth.js (credentials) auth, so Neon Auth stays off. `hello.ts` is a
// scratch Neon Function kept as a deployment smoke test.
export default defineConfig({
  auth: false,
  preview: {
    // Upgrade to a paid plan to enable AI Gateway for your project.
    // aiGateway: true,
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
