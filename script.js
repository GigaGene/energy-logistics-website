const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const sections = [...document.querySelectorAll("main section[id]")];

const setActiveLink = () => {
  const current = sections
    .filter((section) => section.offsetTop <= window.scrollY + 140)
    .at(-1);

  if (!current) return;

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
  });
};

setActiveLink();
window.addEventListener("scroll", setActiveLink, { passive: true });

const leadForms = document.querySelectorAll("[data-lead-form]");
const FORM_ENDPOINT = "/api/submit-lead.php";
const ERROR_ENDPOINT = "/api/report-error.php";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const TEXT_FIELD_MAX_LENGTH = 120;
const TEXTAREA_MAX_LENGTH = 1200;
const safeFileTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const sanitizeText = (value) =>
  String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isRateLimited = () => {
  const now = Date.now();
  const recentSubmissions = JSON.parse(sessionStorage.getItem("energyLogisticsFormRate") || "[]")
    .filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentSubmissions.length >= RATE_LIMIT_MAX_SUBMISSIONS) return true;

  recentSubmissions.push(now);
  sessionStorage.setItem("energyLogisticsFormRate", JSON.stringify(recentSubmissions));
  return false;
};

const buildLeadPayload = (form) => {
  const formData = new FormData(form);
  const fields = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    fields[key] = sanitizeText(value);
  }

  return {
    formType: fields.formType,
    destination: form.dataset.formDestination,
    submittedAt: new Date().toISOString(),
    fields,
  };
};

const validateFileInputs = (form) => {
  const maxBytes = 5 * 1024 * 1024;
  const files = [...form.querySelectorAll('input[type="file"]')].flatMap((input) => [...input.files]);
  return files.every((file) => safeFileTypes.has(file.type) && file.size <= maxBytes);
};

const submitLeadPayload = async (form, payload) => {
  const formData = new FormData(form);
  formData.set("payload", JSON.stringify(payload));

  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Submission failed");
  }

  return response.json();
};

const reportWebsiteError = (details) => {
  const payload = JSON.stringify({
    message: sanitizeText(details.message).slice(0, 500),
    source: sanitizeText(details.source).slice(0, 300),
    line: details.line || "",
    column: details.column || "",
    path: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(ERROR_ENDPOINT, new Blob([payload], { type: "application/json" }));
    if (sent) return;
  }

  fetch(ERROR_ENDPOINT, {
    method: "POST",
    body: payload,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    keepalive: true,
  }).catch(() => {});
};

leadForms.forEach((form) => {
  const errorMessage = form.querySelector("[data-form-error]");
  const successMessage = form.querySelector("[data-form-success]");
  const requiredFields = [...form.querySelectorAll("[required]")];
  const honeypot = form.querySelector('[name="website"]');

  const clearFieldState = (field) => {
    field.classList.remove("field-invalid");
    field.removeAttribute("aria-invalid");
  };

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => clearFieldState(field));
    field.addEventListener("change", () => clearFieldState(field));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const invalidFields = requiredFields.filter((field) => !field.checkValidity());
    const tooLongFields = [...form.querySelectorAll("input, textarea")]
      .filter((field) => {
        const max = field.tagName === "TEXTAREA" ? TEXTAREA_MAX_LENGTH : TEXT_FIELD_MAX_LENGTH;
        return field.value.length > max;
      });

    requiredFields.forEach(clearFieldState);
    successMessage?.classList.remove("is-visible");

    if (honeypot?.value) {
      form.reset();
      return;
    }

    if (isRateLimited()) {
      if (errorMessage) {
        errorMessage.textContent = "Too many submissions. Please wait a few minutes before trying again.";
        errorMessage.classList.add("is-visible");
      }
      return;
    }

    if (invalidFields.length > 0 || tooLongFields.length > 0) {
      [...invalidFields, ...tooLongFields].forEach((field) => {
        field.classList.add("field-invalid");
        field.setAttribute("aria-invalid", "true");
      });

      if (errorMessage) {
        errorMessage.textContent = "Please complete all required fields and keep entries within the allowed length.";
        errorMessage.classList.add("is-visible");
      }

      [...invalidFields, ...tooLongFields][0].focus();
      return;
    }

    if (!validateFileInputs(form)) {
      if (errorMessage) {
        errorMessage.textContent = "Uploads must be PDF, JPG, PNG, DOC, or DOCX files under 5 MB.";
        errorMessage.classList.add("is-visible");
      }
      return;
    }

    errorMessage?.classList.remove("is-visible");
    const payload = buildLeadPayload(form);

    try {
      await submitLeadPayload(form, payload);
      successMessage?.classList.add("is-visible");
      form.reset();
    } catch (error) {
      if (errorMessage) {
        errorMessage.textContent = "Secure submission is not available yet. Please contact dispatch or HR by phone or email.";
        errorMessage.classList.add("is-visible");
      }
    }
  });
});

const cookieNotice = document.querySelector("[data-cookie-notice]");
const cookieAccept = document.querySelector("[data-cookie-accept]");

if (cookieNotice && cookieAccept && localStorage.getItem("energyLogisticsCookieNotice") !== "accepted") {
  cookieNotice.hidden = false;
  cookieAccept.addEventListener("click", () => {
    localStorage.setItem("energyLogisticsCookieNotice", "accepted");
    cookieNotice.hidden = true;
  });
}

window.addEventListener("error", (event) => {
  reportWebsiteError({
    message: event.message || "Unhandled website error",
    source: event.filename || "",
    line: event.lineno || "",
    column: event.colno || "",
  });
});

window.addEventListener("unhandledrejection", (event) => {
  reportWebsiteError({
    message: event.reason?.message || String(event.reason || "Unhandled promise rejection"),
    source: "promise",
  });
});
