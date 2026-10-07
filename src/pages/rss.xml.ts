import { withBase } from "../utils/helpers";
import { getCollection } from "astro:content";
import siteConfig from "../site.config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(context) {
  const articles = await getCollection("articles");
  const siteUrl = (context.site ?? new URL(siteConfig.website)).toString().replace(/\/$/, "");
  const baseUrl = `${siteUrl}${withBase("/")}`;

  const itemsXml = articles
    .map((post) => {
      const articleUrl = `${siteUrl}${withBase(`/articles/${post.id}/`)}`;
      const pubDate = post.data.pubDate ? new Date(post.data.pubDate).toUTCString() : "";

      return `
        <item>
          <title>${escapeXml(post.data.title)}</title>
          <link>${escapeXml(articleUrl)}</link>
          <guid>${escapeXml(articleUrl)}</guid>
          <pubDate>${escapeXml(pubDate)}</pubDate>
          <description>${escapeXml(post.data.description ?? "")}</description>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${escapeXml(siteConfig.title)}</title>
      <link>${escapeXml(baseUrl)}</link>
      <description>${escapeXml(siteConfig.description)}</description>
      <language>en-US</language>
      <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
      ${itemsXml}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
