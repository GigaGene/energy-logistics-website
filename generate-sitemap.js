const fs = require("fs");
const path = require("path");
const { company, cities, services, routeFamilies } = require("./landing-data");

const urls = new Set([`${company.website}/`]);
const optionalStaticPages = ["privacy.html", "terms.html"];

const addUrl = (pathname) => {
  urls.add(`${company.website}${pathname}`);
};

optionalStaticPages.forEach((page) => {
  if (fs.existsSync(path.join(__dirname, page))) {
    addUrl(`/${page}`);
  }
});

const servicesRoute = routeFamilies.find((route) => route.prefix === "services");

if (servicesRoute) {
  services.forEach((service) => {
    cities.forEach((city) => {
      addUrl(`/services/${service.slug}/${city.slug}`);
    });
  });
}

routeFamilies
  .filter((route) => route.cityOnly)
  .forEach((route) => {
    cities.forEach((city) => {
      addUrl(`/${route.prefix}/${city.slug}`);
    });
  });

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.endsWith("/") ? "monthly" : "weekly"}</changefreq>
    <priority>${url.endsWith("/") ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, "sitemap.xml"), xml);
console.log(`Generated sitemap.xml with ${urls.size} URLs.`);
