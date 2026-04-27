import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "data/**",
      "docs/**",
      "public/**",
    ],
  },
  {
    rules: {
      // This project intentionally keeps many editable/admin/public assets as plain files
      // under `public/images/**`, so native `<img>` usage remains an explicit tradeoff.
      "@next/next/no-img-element": "off",
      // The root App Router layout loads shared fonts globally; this legacy rule still flags it.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
