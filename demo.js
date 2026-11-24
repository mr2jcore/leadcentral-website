const form = document.querySelector("#demoForm");
const output = document.querySelector("#demoOutput");
const status = document.querySelector("#demoStatus");
const button = document.querySelector("#prepareBtn");
let lastBriefing = "";
const $ = id => document.getElementById(id);

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = String(text);
  if (className) el.className = className;
  return el;
}
function link(url, label) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return node("span", label || url);
    const a = node("a", label || parsed.hostname);
    a.href = parsed.href; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  } catch { return node("span", label || "Source unavailable"); }
}
function sectionText(parent, label, value) {
  if (!value) return;
  parent.append(node("p", label, "demo-label"), node("p", value));
}
function bullets(parent, entries) {
  if (!entries || !entries.length) return;
  const ul = node("ul");
  for (const item of entries) ul.append(node("li", item));
  parent.append(ul);
}
function render(data) {
  const prop = $("propertyInfo"); prop.replaceChildren();
  sectionText(prop, "Property", data.property.title || "Title not available");
  sectionText(prop, "Description", data.property.description || "Description could not be extracted");
  if (data.property.location) sectionText(prop,"Location identified",data.property.location);
  bullets(prop, data.property.highlights);
  const psource = node("p"); psource.append(link(data.property.source, "Open original listing")); prop.append(psource);

  const images = $("propertyImages"); images.replaceChildren();
  for (const item of (data.property.images || []).slice(0,6)) {
    const img = node("img"); img.src=item.url; img.alt=item.alt || "Listing photograph"; img.loading="lazy"; img.referrerPolicy="no-referrer"; images.append(img);
  }
  const agency = $("agencyInfo"); agency.replaceChildren();
  sectionText(agency,"Website",data.agency.name || data.agency.domain);
  if (data.agency.description) sectionText(agency,"About the agency",data.agency.description);
  bullets(agency,data.agency.highlights);
  const links=node("p",null,"demo-links");
  for (const src of (data.agency.sources||[])) { links.append(link(src, new URL(src).pathname === "/" ? "Agency home" : "Agency page")); }
  agency.append(links);

  const market = $("marketInfo"); market.replaceChildren();
  sectionText(market,"Research status",data.localResearch.status);
  if (data.localResearch.location) sectionText(market,"Area",data.localResearch.location);
  if (data.localResearch.sources.length) {
    market.append(node("p","Potentially relevant sources (snippets are unverified; check the source and publication date before quoting figures):"));
    const ul=node("ul");
    for (const s of data.localResearch.sources) {
      const li=node("li"); li.append(link(s.url,s.title));
      if (s.snippet) li.append(node("p",s.snippet));
      ul.append(li);
    }
    market.append(ul);
  } else {
    market.append(node("p","Local market claims are withheld until a source-backed research provider is configured and a reliable location is identified."));
  }
  status.textContent = data.warnings.length ? "Some information was unavailable: " + data.warnings.join("; ") : "Property and agency preview prepared from publicly available pages.";
  lastBriefing=data.agentBriefing;
  $("briefingText").textContent=lastBriefing;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const phone=$("demoPhone").value.trim().replace(/[\s().-]/g,"");
  if(!/^\+[1-9]\d{6,14}$/.test(phone)) {
    $("demoPhone").setCustomValidity("Enter a WhatsApp number including its international country code.");
    $("demoPhone").reportValidity();
    return;
  }
  $("demoPhone").setCustomValidity("");
  const listingUrl=$("demoListing").value.trim();
  button.disabled=true;button.textContent="Researching public listing…";
  output.hidden=false; status.textContent="Checking the property and agency website…";status.className="";
  ["propertyInfo","propertyImages","agencyInfo","marketInfo"].forEach(id=>$(id).replaceChildren());
  $("briefingText").textContent="Preparing briefing…";
  try {
    const res=await fetch("/api/prepare",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({listingUrl})
    });
    const result=await res.json();
    if(!res.ok) throw new Error(result.error || "Research unavailable");
    render(result);
  } catch (error) {
    status.textContent="Could not prepare this listing: "+error.message+
      ". Some agency sites block automated access; the listing may need a different public URL.";
    status.className="demo-error";
    $("briefingText").textContent="No briefing was produced.";
    lastBriefing="";
  } finally {
    button.disabled=false;button.textContent="Prepare my buyer demo";
    output.scrollIntoView({behavior:"smooth",block:"start"});
  }
});
$("demoPhone").addEventListener("input",()=>{$("demoPhone").setCustomValidity("");});
$("copyBriefing").addEventListener("click",async()=> {
  if(!lastBriefing) return;
  try { await navigator.clipboard.writeText(lastBriefing); $("copyBriefing").textContent="Copied"; }
  catch { $("copyBriefing").textContent="Select briefing text to copy"; }
});
