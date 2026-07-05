// Telegram lead notifications via Make.com webhook.
//
// The webhook URL below is the only integration value that lives in this repo.
// The Telegram bot token and chat ID are configured inside Make.com only and
// must never appear anywhere in frontend code.
//
// Replace the placeholder with the real Make.com webhook URL to activate
// notifications. While the placeholder is in place, calls are skipped silently
// and the site behaves exactly as before.
const MAKE_WEBHOOK_URL = "YOUR_MAKE_WEBHOOK_URL_HERE";

// Maps each site form onto the flat field names used by the Make.com
// Telegram message templates.
const FORM_TYPE_MAP = {
  "Driver Application": {
    formType: "DRIVER APPLICATION",
    fields: {
      name: "fullName",
      phone: "phone",
      email: "email",
      cdl_class: "cdlClass",
      experience: "experience",
      state: "state",
      message: "message",
    },
  },
  "Broker Freight Request": {
    formType: "FREIGHT REQUEST",
    fields: {
      name: "contactName",
      company: "companyName",
      phone: "phone",
      email: "email",
      origin: "origin",
      destination: "destination",
      load_type: "freightType",
      message: "notes",
    },
  },
  "Owner Operator Application": {
    formType: "OWNER OPERATOR APPLICATION",
    fields: {
      name: "fullName",
      phone: "phone",
      email: "email",
      truck_year: "truckYear",
      truck_make: "truckMake",
      trailer_type: "trailerType",
      state: "state",
      message: "message",
    },
  },
};

async function sendLeadNotification(formType, data) {
  try {
    if (!MAKE_WEBHOOK_URL || MAKE_WEBHOOK_URL === "YOUR_MAKE_WEBHOOK_URL_HERE") {
      console.info("Telegram notification skipped: Make.com webhook URL not configured.");
      return;
    }

    const mapping = FORM_TYPE_MAP[formType];
    const payload = { formType: mapping ? mapping.formType : formType };

    if (mapping) {
      Object.entries(mapping.fields).forEach(([key, sourceField]) => {
        payload[key] = data[sourceField] || "";
      });
    } else {
      Object.assign(payload, data);
    }

    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Notification failed silently:", error);
    // Never crash the site.
  }
}
