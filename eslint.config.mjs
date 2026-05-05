import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "out/**",
      "dist/**",
      "**/*.d.ts",
      "esbuild.mjs",
      "eslint.config.mjs"
    ]
  },
  {
    rules: {
      "@typescript-eslint/naming-convention": "warn",
      "curly": "warn",
      "eqeqeq": "warn",
      "semi": "off"
    }
  }
);