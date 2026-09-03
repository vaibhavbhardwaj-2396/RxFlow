import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),

  ...nextVitals,
  ...nextTs,

  // Architecture boundary: src/domain/ is pure. No framework, no persistence,
  // no dependency on outer layers. See the assessment (section 02).
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "domain/ must stay framework-free." },
            { name: "react-dom", message: "domain/ must stay framework-free." },
            {
              name: "@prisma/client",
              message:
                "domain/ must not touch persistence — take plain inputs.",
            },
          ],
          patterns: [
            {
              group: ["next", "next/*"],
              message: "domain/ must stay framework-free.",
            },
            {
              group: ["@/server/*", "@/app/*", "@/components/*"],
              message: "domain/ must not depend on outer layers.",
            },
          ],
        },
      ],
    },
  },

  prettier,
]);

export default eslintConfig;
