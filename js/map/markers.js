export function clearMarkers(markers){
  for (const m of markers || []) m.remove();
}

export function addPlaceMarkers(map, places, onClick){
  const markers = [];
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 18
  });

  for (const p of (places || [])) {
    if (typeof p.lng !== "number" || typeof p.lat !== "number") continue;

    const el = document.createElement("div");
    el.className = "pin";
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.borderRadius = "999px";
    el.style.border = "1px solid rgba(255,255,255,.75)";
    el.style.background = "rgba(122,162,255,.40)";
    el.style.boxShadow = "0 10px 25px rgba(0,0,0,.35)";
    el.style.cursor = "pointer";

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([p.lng, p.lat])
      .addTo(map);

    el.addEventListener("mouseenter", () => {
      const highlights = Array.isArray(p.highlights) ? p.highlights.slice(0, 4) : [];
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:#0b1220;">
          <div style="font-weight:800; margin-bottom:6px;">${escapeHtml(p.name || "Place")}</div>
          ${highlights.length ? `<ul style="margin:0; padding-left:16px;">${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}</ul>` : ""}
        </div>
      `;
      popup.setLngLat([p.lng, p.lat]).setHTML(html).addTo(map);
    });

    el.addEventListener("mouseleave", () => {
      popup.remove();
    });

    el.addEventListener("click", (e) => {
      e.preventDefault();
      onClick?.(p);
    });

    markers.push(marker);
  }

  return markers;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
