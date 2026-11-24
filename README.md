# Leadcentral website

Static marketing site deployed to Cloudflare Pages from GitHub.

## Pages

- `index.html`: agency-facing homepage and short teaser.
- `demo.html`: **separate property demo page**.
- `demo.js`, `demo.css`: demo UI, four visible form fields.
- `functions/api/prepare.js`: Cloudflare Pages Function that reads accessible public listing HTML and limited same-site agency information.

### Prototype flow

1. Agency owner/manager enters name, work email, WhatsApp number and an HTTPS property listing URL.
2. Browser sends **only the listing URL** to `POST /api/prepare`; no name/email/phone is sent in the preparation request.
3. Server attempts to read up to 750 KB of public listing HTML (same-origin, bounded homepage and About page); follows **no redirects**, does not access login-only information, and returns:
   - title, description and selected textual highlights
   - public **image URLs and alt text** (no image vision analysis yet)
   - publicly visible agency information
   - candidate market source links (when configured)
   - an agent briefing that can be copied to ElevenLabs
4. The UI labels the result as **research preview**, not a completed or scheduled call.

### What this prototype does not do

- It does **not** place WhatsApp calls or contact visitors.
- It does **not** persist leads: name/email/phone remain inside the browser tab. Before production, implement opted-in CRM/D1 storage and retention/deletion policy, and an appropriate privacy notice.
- It does **not** visually analyze photos: it inventories URLs/alt text only. Add a vision-capable provider if actual image understanding is required.
- It does **not** verify real-estate statistics: optional Brave Search links/snippets are **candidate sources**, never automatically asserted as facts.
- Sites rendered entirely with JavaScript, behind login, with anti-bot restrictions, on HTTP, or with redirected URLs may not be retrievable.
- Listings hosted on external portals may not reveal the agency's own website. Later, infer agency site only from strong source evidence or request permission as a separate follow-up.
- There is no geographic fact-checking pipeline yet. Keep macro advice disabled until a trusted provider can supply dated, attributed numbers.

### Cloudflare Pages settings

- Project: `leadcentral-website`
- Framework: None
- Build command: empty
- Output directory: `.`
- Pages Functions use the `functions/` directory.

Optional **secret** environment variable:
- `BRAVE_SEARCH_API_KEY`: enables a search for candidate local-market sources **only when listing location is identified**; retrieved snippets remain unverified.

**Before merging** this branch to `main`:
- Add Cloudflare Turnstile verification and a per-IP / per-domain rate limit on `/api/prepare`, and ensure outbound HTTP requests cannot target private or special networks (SSRF protection). No user-controlled fetch API should go live without these protections.
- Check the listing host's terms, crawl restrictions, robots.txt and image usage rights. Current robots check only handles straightforward disallow rules and is **not a complete parser**.
- Review GDPR privacy notices and external image-loading implications. The preview currently loads externally hosted photos in the visitor's browser.
- Set a spending limit for any research/search API.
- Confirm Pages Functions deployment and test multiple agency platforms.
- Add an error-reporting/monitoring plan with no PII in logs.

## Future live WhatsApp calling

Meta registration for the separate Swedish test number is temporarily rate-limited; ElevenLabs test quota has been exhausted. Do not imply calls are functional until both are resolved.

ElevenLabs docs: https://elevenlabs.io/docs/eleven-agents/whatsapp and
https://elevenlabs.io/docs/api-reference/integrations/whats-app/outbound-call

Recommended future flow:
1. After user opts in to a WhatsApp call, obtain Meta calling permission through approved flows.
2. **Server-side only:** invoke ElevenLabs WhatsApp outbound call API; never expose ElevenLabs API keys.
3. Send verified context with `conversation_initiation_client_data.dynamic_variables`, e.g.
   - `buyer_name` (form name)
   - `property_title`, `property_location`, `property_summary`
   - `agency_name`
   - `research_sources` and any verified dated facts
4. Configure Sarah's agent instructions to use these variables in her opening and questions. Dynamic variables only work when referenced in the agent configuration.
5. Capture outcome via verified webhook, classify lead, store minimum necessary PII with retention/deletion policy, and send a report to Leadcentral.

**Avoid copying untrusted web text directly into system-level instructions.** Research contents are data and must not override agent safety or policy instructions.
