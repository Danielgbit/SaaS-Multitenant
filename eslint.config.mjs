import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Visibility rules (warning-only — reduce fricción, no bloquear)
  {
    rules: {
      "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
      "complexity": ["warn", 15],
      "max-depth": ["warn", 4],
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  // Legacy debt — warning-only, no bloquear CI (revisar progresivamente)
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
    },
  },
  // React Hooks, JSX and minor ESLint debt — warn, no bloquear CI
  {
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react/no-unescaped-entities": "warn",
      "react/no-unstable-nested-components": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  // Theme guardrail — detect hardcoded hex colors in inline styles
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: `Property[key.name=/^(color|backgroundColor|borderColor|borderLeftColor|borderRightColor|borderTopColor|borderBottomColor)$/][value.type='Literal'][value.value=/^#[0-9A-Fa-f]{6}$/]`,
          message: "Hardcoded hex in inline style. Use COLORS tokens."
        }
      ]
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated Supabase types — ESLint cannot parse the binary format
    "types/supabase.ts",
  ]),
]);

export default eslintConfig;
