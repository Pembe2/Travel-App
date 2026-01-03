const formatHighlights = (highlights = []) =>
  highlights
    .slice(0, 3)
    .map((item) => `<li>${item}</li>`)
    .join('');

export const createPoiTooltip = (poi) => `
  <div class="tooltip-content">
    <strong>${poi.name}</strong>
    <p class="muted">${poi.summary || ''}</p>
    <ul class="highlights">${formatHighlights(poi.highlights)}</ul>
  </div>
`;
