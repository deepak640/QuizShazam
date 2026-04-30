export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://quizshazam.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: ["/dashboard", "/profile", "/upload", "/reset-password"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
