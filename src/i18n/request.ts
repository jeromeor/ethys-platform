import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

// Liste des langues gérées
const SUPPORTED = ["fr", "en"];

export default getRequestConfig(async () => {
  // On lit la langue choisie dans le cookie ; défaut = français
  const store = await cookies();
  const cookieLocale = store.get("LOCALE")?.value;
  const locale = cookieLocale && SUPPORTED.includes(cookieLocale) ? cookieLocale : "fr";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
