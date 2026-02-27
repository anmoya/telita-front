import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    }
  },
  {
    files: ["src/modules/**/*.ts", "src/modules/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "JSXOpeningElement[name.name='select']",
          "message": "Use Select from src/shared/ui/primitives/select."
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["date-fns", "dayjs", "luxon"],
              "message": "Use shared time wrappers from src/shared/time."
            },
            {
              "group": ["@radix-ui/*", "antd", "@mui/*"],
              "message": "Use UI wrappers from src/shared/ui/primitives."
            }
          ]
        }
      ]
    }
  }
];
