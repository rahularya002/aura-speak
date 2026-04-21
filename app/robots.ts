import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://avatars.enbquantum.com/sitemap.xml",
    host: "https://avatars.enbquantum.com",
  };
}
