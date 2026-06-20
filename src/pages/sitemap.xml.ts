const pages = ["/", "/library/"];

export function GET({ site }: { site: URL }) {
  const urls = pages
    .map((path) => {
      const loc = new URL(path, site).toString();
      return `<url><loc>${loc}</loc></url>`;
    })
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml"
      }
    }
  );
}
