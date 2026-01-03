export function setStatus(text){
  const el = document.getElementById("status");
  if (el) el.textContent = text || "";
}

export function renderPlacesList(places, onClick){
  const list = document.getElementById("placesList");
  list.innerHTML = "";

  if (!places?.length) {
    const d = document.createElement("div");
    d.className = "placeholder muted";
    d.textContent = "No places returned. Try refining your ask.";
    list.appendChild(d);
    return;
  }

  for (const p of places) {
    const card = document.createElement("div");
    card.className = "placeCard";
    card.innerHTML = `
      <div class="placeCard__top">
        <div class="placeCard__name"></div>
        <div class="placeCard__cat"></div>
      </div>
      <div class="placeCard__why"></div>
    `;
    card.querySelector(".placeCard__name").textContent = p.name || "Untitled";
    card.querySelector(".placeCard__cat").textContent = p.category || "place";
    card.querySelector(".placeCard__why").textContent = p.why_go || "";

    card.addEventListener("click", () => onClick?.(p));
    list.appendChild(card);
  }
}

export function openDetail(place){
  const detail = document.getElementById("detail");
  if (!detail) return;

  detail.setAttribute("aria-hidden", "false");

  document.getElementById("detailTitle").textContent = place.name || "Place";
  document.getElementById("detailMeta").textContent =
    `${place.category || "place"} • ${formatCoord(place.lat, place.lng)} • ${formatTime(place.time_needed_hours)}`;

  document.getElementById("detailWhy").textContent = place.why_go || "—";

  const ul = document.getElementById("detailHighlights");
  ul.innerHTML = "";
  const highlights = Array.isArray(place.highlights) ? place.highlights : [];
  for (const h of highlights.slice(0, 6)) {
    const li = document.createElement("li");
    li.textContent = h;
    ul.appendChild(li);
  }

  const tips = [];
  if (place.best_time_of_day) tips.push(`Best time: ${place.best_time_of_day.replaceAll("_"," ")}`);
  if (Array.isArray(place.tags) && place.tags.length) tips.push(`Tags: ${place.tags.slice(0,6).join(", ")}`);
  if (place.confidence != null) tips.push(`Geocode confidence: ${Math.round(place.confidence * 100)}%`);
  document.getElementById("detailTips").textContent = tips.join(" • ") || "—";
}

export function wireDetailClose(){
  const btn = document.getElementById("closeDetail");
  const detail = document.getElementById("detail");
  btn?.addEventListener("click", () => {
    detail?.setAttribute("aria-hidden", "true");
  });
}

function formatCoord(lat, lng){
  if (typeof lat !== "number" || typeof lng !== "number") return "—";
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
function formatTime(hours){
  if (!hours || typeof hours !== "number") return "time: —";
  return `time: ~${hours}h`;
}
