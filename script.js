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

const buildLeadPayload = (form) => {
  const formData = new FormData(form);
  const fields = Object.fromEntries(formData.entries());

  return {
    formType: fields.formType,
    destination: form.dataset.formDestination,
    integrations: (form.dataset.integrations || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    submittedAt: new Date().toISOString(),
    fields,
  };
};

const submitLeadPayload = async (payload) => {
  // Future production integrations can be connected here:
  // Telegram bot webhook, Gmail notification endpoint, and Google Sheets API.
  const savedLeads = JSON.parse(localStorage.getItem("energyLogisticsLeads") || "[]");
  savedLeads.push(payload);
  localStorage.setItem("energyLogisticsLeads", JSON.stringify(savedLeads));
  console.info("Energy Logistics lead captured", payload);
};

leadForms.forEach((form) => {
  const errorMessage = form.querySelector("[data-form-error]");
  const successMessage = form.querySelector("[data-form-success]");
  const requiredFields = [...form.querySelectorAll("[required]")];

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

    requiredFields.forEach(clearFieldState);
    successMessage?.classList.remove("is-visible");

    if (invalidFields.length > 0) {
      invalidFields.forEach((field) => {
        field.classList.add("field-invalid");
        field.setAttribute("aria-invalid", "true");
      });

      if (errorMessage) {
        errorMessage.textContent = "Please complete all required fields before submitting.";
        errorMessage.classList.add("is-visible");
      }

      invalidFields[0].focus();
      return;
    }

    errorMessage?.classList.remove("is-visible");
    const payload = buildLeadPayload(form);
    await submitLeadPayload(payload);
    successMessage?.classList.add("is-visible");
    form.reset();
  });
});
