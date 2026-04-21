import type { MetadataRoute } from "next";

const baseUrl = "https://avatars.enbquantum.com";

const routes = [
  "/",
  "/chat",
  "/overview",
  "/models",
  "/knowledge",
  "/avatar",
  "/deployment",
  "/settings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
