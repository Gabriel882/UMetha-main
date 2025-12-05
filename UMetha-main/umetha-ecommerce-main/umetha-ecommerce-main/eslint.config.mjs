import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const baseDirectory = fileURLToPath(new URL(".", import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const baseConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "data/**",
      "migrations/**",
      "prisma/**",
      "lib/partials/**",
      "types/**",
      "app/api/seed/**",
      "app/(deprecated)/**",
      "config/**",
      "static/**",
      "tailwind.config.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default baseConfig;
