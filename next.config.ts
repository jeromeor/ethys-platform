import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Branche next-intl sur le fichier de config des traductions
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
