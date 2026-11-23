// Set this to the agency's scheduling URL when available.
const bookingUrl = "";
const storageKey = "leadcentral.preview.v1";
const contact = document.getElementById("contact");
const buyer = document.getElementById("buyer");
const result = document.getElementById("result");
const stages = { contact, buyer, result };
let stage = "contact";

if (bookingUrl) {
  document.querySelectorAll(".booking").forEach(link => link.href = bookingUrl);
} else {
  document.querySelectorAll(".booking").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      document.getElementById("booking").showModal();
    });
  });
}

function values(form) {
  return Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]));
}

function save() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ stage, contact: values(contact), buyer: values(buyer) }));
  } catch { /* The preview also works in memory when browser storage is unavailable. */ }
}

function fill(form, data) {
  for (const [name, value] of Object.entries(data || {})) {
    const field = form.elements.namedItem(name);
    if (!field || typeof value !== "string") continue;
    if (field.type === "checkbox") field.checked = value === "on";
    else field.value = value;
  }
}

function show(next, focus = true) {
  stage = next;
  for (const [key, panel] of Object.entries(stages)) panel.hidden = key !== next;
  if (next === "result") renderRecord();
  if (focus) stages[next].querySelector("h3").focus();
}

// An illustrative triage rule based on stated timing and available buyer criteria.
function assess(data) {
  if (data.timing === "Within 3 months" && data.budget && data.location && data.property) {
    return ["High priority", "The buyer supplied a property type, area, and budget, and plans to buy within three months."];
  }
  if (data.timing === "Just exploring" || data.timing === "In more than 6 months") {
    return ["Nurture", "The stated timeframe suggests a longer-term conversation."];
  }
  return ["Needs follow-up", "The answers leave the purchase timeframe or the near-term buying brief to clarify."];
}

function renderRecord() {
  const person = values(contact);
  const data = values(buyer);
  const [grade, reason] = assess(data);
  document.getElementById("grade").textContent = "Illustrative grade · " + grade;
  document.getElementById("reason").textContent = reason;
  const record = document.getElementById("record");
  record.replaceChildren();
  const fields = [
    ["Name", person.name], ["Email", person.email], ["Phone", person.phone],
    ["Call channel", person.channel], ["Listing link", person.listing], ["Property sought", data.property],
    ["Preferred area", data.location], ["Timeframe", data.timing], ["Budget", data.budget],
    ["Must-haves", data.must], ["Nice-to-haves", data.nice]
  ];
  for (const [label, value] of fields) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const answer = document.createElement("dd");
    term.textContent = label;
    answer.textContent = value || "Not discussed";
    row.append(term, answer);
    record.append(row);
  }
}

const listing = contact.elements.listing;
const phone = contact.elements.phone;
function validateDetails() {
  let linked = false;
  try { linked = ["https:", "http:"].includes(new URL(listing.value).protocol); } catch {}
  listing.setCustomValidity(linked ? "" : "Enter a property URL beginning with https:// or http://.");
  const international = /^\+[1-9]\d{6,14}$/.test(phone.value.replace(/[\s().-]/g, ""));
  phone.setCustomValidity(international ? "" : "Include +, your country code, and the phone number.");
  contact.elements.name.setCustomValidity(contact.elements.name.value.trim() ? "" : "Enter a name or use sample details.");
}

document.getElementById("sample").onclick = () => {
  fill(contact, { listing: "https://example.com/property/demo", name: "Alex Morgan", email: "alex@example.com", phone: "+44 7700 900123" });
  validateDetails();
  save();
};
contact.addEventListener("input", () => { validateDetails(); save(); });
buyer.addEventListener("input", save);
contact.onsubmit = event => {
  event.preventDefault();
  validateDetails();
  if (contact.reportValidity()) { show("buyer"); save(); }
};
buyer.onsubmit = event => { event.preventDefault(); show("result"); save(); };
document.getElementById("back").onclick = () => { show("contact"); save(); };
document.getElementById("edit").onclick = () => { show("buyer"); save(); };
document.getElementById("reset").onclick = () => {
  contact.reset();
  buyer.reset();
  document.getElementById("record").replaceChildren();
  show("contact");
  try { sessionStorage.removeItem(storageKey); } catch {}
};
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey));
  if (saved && Object.hasOwn(stages, saved.stage)) {
    fill(contact, saved.contact);
    fill(buyer, saved.buyer);
    validateDetails();
    show(contact.checkValidity() ? saved.stage : "contact", false);
  }
} catch { /* Start with an empty preview if the saved draft cannot be read. */ }
