(function () {
  const data = window.EnergyLandingData;
  const pageRoot = document.querySelector("[data-landing-page]");

  if (!data || !pageRoot) return;

  const { company, cities, services, routeFamilies } = data;
  const bySlug = (items, slug) => items.find((item) => item.slug === slug);
  const titleCase = (value) => value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const setMeta = (name, content) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  const setPropertyMeta = (property, content) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  const setCanonical = (url) => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  };

  const addJsonLd = (id, payload) => {
    const old = document.getElementById(id);
    old?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  };

  const resolveRoute = () => {
    const parts = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);

    if (parts.length === 3 && parts[0] === "services") {
      return {
        family: bySlug(routeFamilies, "services") || routeFamilies.find((route) => route.prefix === "services"),
        service: bySlug(services, parts[1]),
        city: bySlug(cities, parts[2]),
        path: `/${parts.join("/")}`,
      };
    }

    if (parts.length === 2) {
      const family = routeFamilies.find((route) => route.prefix === parts[0] && route.cityOnly);
      if (family) {
        return {
          family,
          service: bySlug(services, family.serviceSlug),
          city: bySlug(cities, parts[1]),
          path: `/${parts.join("/")}`,
        };
      }
    }

    return null;
  };

  const route = resolveRoute();

  if (!route?.service || !route?.city) {
    document.title = `Landing Page Not Found | ${company.name}`;
    setMeta("description", "The requested Energy Logistics landing page could not be found.");
    pageRoot.innerHTML = `
      <section class="page-hero compact-page-hero">
        <div class="container">
          <p class="eyebrow">Page Not Found</p>
          <h1>We could not find that freight page.</h1>
          <p>Return to the main Energy Logistics website or contact dispatch for freight capacity.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="/">Go Home</a>
            <a class="btn btn-secondary" href="tel:${company.phone}">Call ${company.phoneDisplay}</a>
          </div>
        </div>
      </section>`;
    return;
  }

  const { service, city } = route;
  const cityLabel = `${city.name}, ${city.state}`;
  const canonical = `${company.website}${route.path}`;
  const isDriver = service.routeType === "driver";
  const isOwnerOperator = service.slug === "owner-operator-opportunities";
  const title = `${service.titlePrefix} in ${cityLabel} | Washington Transportation Company`;
  const description = `${company.name} provides ${service.noun} in ${cityLabel} for ${city.useCases.slice(0, 2).join(" and ")} near ${city.hubs.slice(0, 2).join(" and ")}. Request dispatch support today.`;
  const h1 = `Reliable ${service.headlineNoun} in ${cityLabel}`;
  const freightSubject = encodeURIComponent(`${service.name} Quote Request - ${cityLabel}`);
  const driverSubject = encodeURIComponent(`${service.name} Application - ${cityLabel}`);

  document.title = title;
  setMeta("description", description);
  setMeta("robots", "index,follow");
  setPropertyMeta("og:title", title);
  setPropertyMeta("og:description", description);
  setPropertyMeta("og:type", "website");
  setPropertyMeta("og:url", canonical);
  setCanonical(canonical);

  const cityUseCases = city.useCases.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const hubs = city.hubs.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const corridors = city.corridors.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const benefits = service.benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const faqs = [
    ...service.faqs,
    [
      `Why choose Energy Logistics in ${cityLabel}?`,
      `Energy Logistics LLC understands freight activity ${city.localPhrase}. Dispatch can review ${service.noun} tied to ${city.hubs.slice(0, 2).join(", ")} and nearby ${city.market} routes.`,
    ],
    [
      `Which ${city.name} freight areas are relevant?`,
      `Common local reference points include ${city.hubs.join(", ")} with access to ${city.corridors.join(", ")} depending on the lane and appointment schedule.`,
    ],
  ];

  const faqHtml = faqs
    .map(
      ([question, answer]) => `
        <details>
          <summary>${escapeHtml(question)}</summary>
          <p>${escapeHtml(answer)}</p>
        </details>`
    )
    .join("");

  pageRoot.innerHTML = `
    <section class="page-hero landing-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/#services">${escapeHtml(route.family.label || "Services")}</a>
          <span>/</span>
          <span>${escapeHtml(cityLabel)}</span>
        </nav>
        <p class="eyebrow">${escapeHtml(service.name)} | ${escapeHtml(city.market)}</p>
        <h1>${escapeHtml(h1)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="mailto:${company.dispatchEmail}?subject=${freightSubject}">Request a Freight Quote from Dispatch</a>
          <a class="btn btn-secondary" href="tel:${company.phone}">Call ${company.phoneDisplay}</a>
          ${
            isDriver
              ? `<a class="btn btn-secondary" href="mailto:${company.hrEmail}?subject=${driverSubject}">${isOwnerOperator ? "Apply as an Owner Operator" : "Start Driver Application"}</a>`
              : ""
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container landing-intro-grid">
        <article>
          <p class="eyebrow">Local Freight Support</p>
          <h2>${escapeHtml(service.name)} for ${escapeHtml(city.name)} shippers and brokers.</h2>
          <p class="lead">Energy Logistics LLC supports ${escapeHtml(service.noun)} in ${escapeHtml(cityLabel)} ${escapeHtml(city.localPhrase)}.</p>
          <p>Whether the shipment touches ${escapeHtml(city.hubs[0])}, moves through ${escapeHtml(city.corridors[0])}, or supports ${escapeHtml(city.useCases[0])}, dispatch can review the lane, equipment needs, schedule, commodity, and communication requirements before quoting capacity.</p>
        </article>
        <aside class="local-panel">
          <h3>${escapeHtml(city.name)} freight context</h3>
          <div class="tag-group" aria-label="Nearby freight hubs">${hubs}</div>
          <h3>Primary corridors</h3>
          <div class="tag-group" aria-label="Freight corridors">${corridors}</div>
        </aside>
      </div>
    </section>

    <section class="section band">
      <div class="container split">
        <div>
          <p class="eyebrow">Service Overview</p>
          <h2>Built for real freight operations, not generic lead pages.</h2>
          <p class="lead">${escapeHtml(service.description)}</p>
          <p>For ${escapeHtml(city.name)} businesses, that can mean support for ${escapeHtml(city.useCases.slice(0, 3).join(", "))}, and freight moving between local warehouses, receivers, ports, distribution centers, and interstate lanes.</p>
        </div>
        <div class="program-card">
          <h3>Business use cases</h3>
          <ul class="check-list">${cityUseCases}</ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">Benefits</p>
          <h2>Why ${escapeHtml(city.name)} freight teams work with Energy Logistics.</h2>
        </div>
        <div class="benefit-grid">
          ${service.benefits
            .map(
              (item, index) => `
                <article class="service-card">
                  <span class="icon-box">${String(index + 1).padStart(2, "0")}</span>
                  <h3>${escapeHtml(item)}</h3>
                  <p>Useful for ${escapeHtml(city.market)} lanes connected to ${escapeHtml(city.hubs[index % city.hubs.length])} and ${escapeHtml(city.corridors[index % city.corridors.length])}.</p>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section band">
      <div class="container split reverse">
        <div class="landing-cta-card">
          <p class="eyebrow">Contact Dispatch</p>
          <h2>Request capacity for ${escapeHtml(service.name.toLowerCase())} in ${escapeHtml(cityLabel)}.</h2>
          <p>Send origin, destination, appointment times, freight type, weight, temperature requirements if applicable, and tracking expectations.</p>
          <div class="section-actions">
            <a class="btn btn-primary" href="mailto:${company.dispatchEmail}?subject=${freightSubject}">Request a Freight Quote from Dispatch</a>
            <a class="btn btn-link" href="tel:${company.phone}">Call Dispatch</a>
          </div>
        </div>
        <div class="landing-cta-card">
          <p class="eyebrow">${isDriver ? "Careers" : "Driver Recruiting"}</p>
          <h2>${isDriver ? `Apply for ${escapeHtml(service.name)} near ${escapeHtml(city.name)}.` : "CDL drivers and owner operators can connect with the team."}</h2>
          <p>${isOwnerOperator ? "Owner operators can share equipment, preferred lanes, and availability with recruiting." : "Drivers can contact HR about CDL opportunities, paid training, weekly pay, and flexible openings."}</p>
          <div class="section-actions">
            <a class="btn btn-primary" href="mailto:${company.hrEmail}?subject=${driverSubject}">${isOwnerOperator ? "Apply as an Owner Operator" : "Start Driver Application"}</a>
            <a class="btn btn-link" href="/#drivers">View Driver Info</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container faq-shell">
        <div class="section-heading">
          <p class="eyebrow">FAQ</p>
          <h2>${escapeHtml(service.name)} questions for ${escapeHtml(cityLabel)}.</h2>
        </div>
        <div class="faq-list">${faqHtml}</div>
      </div>
    </section>
  `;

  addJsonLd("schema-organization", {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: company.name,
    legalName: company.legalName,
    url: company.website,
    telephone: company.phoneDisplay,
    email: company.dispatchEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: company.baseCity,
      addressRegion: company.baseState,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "Place",
      name: `${cityLabel} and lower 48 states except New York`,
    },
  });

  addJsonLd("schema-service", {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.name} in ${cityLabel}`,
    serviceType: service.name,
    provider: {
      "@type": "Organization",
      name: company.name,
      url: company.website,
    },
    areaServed: {
      "@type": "City",
      name: city.name,
      address: {
        "@type": "PostalAddress",
        addressRegion: city.state,
        addressCountry: "US",
      },
    },
    description,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: canonical,
    },
  });

  addJsonLd("schema-breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: company.website },
      { "@type": "ListItem", position: 2, name: route.family.label || "Services", item: `${company.website}/#services` },
      { "@type": "ListItem", position: 3, name: `${service.name} in ${cityLabel}`, item: canonical },
    ],
  });

  addJsonLd("schema-faq", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  });
})();
