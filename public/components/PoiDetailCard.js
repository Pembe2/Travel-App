const createTags = (tags = []) =>
  tags
    .slice(0, 8)
    .map((tag) => {
      const isCategory = tag.toLowerCase() === tag;
      return `<span class="tag ${isCategory ? '' : 'badge'}">${tag}</span>`;
    })
    .join('');

export const createPoiDetailCard = (poi) => {
  const wrapper = document.createElement('article');
  wrapper.className = 'detail-card-body';
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('aria-label', `${poi.name} details`);

  const geocodeBadge = poi.geocodeStatus !== 'ok'
    ? '<span class="tag badge" aria-label="Pin unavailable">Pin unavailable</span>'
    : '';

  wrapper.innerHTML = `
    <div class="detail-header">
      <div>
        <h3 class="detail-title">${poi.name}</h3>
        <p class="muted">${poi.summary || 'No summary available.'}</p>
      </div>
      <div class="pill-row">
        <span class="tag category" aria-label="Category">${poi.category}</span>
        ${geocodeBadge}
      </div>
    </div>
    <ul class="highlights">
      ${(poi.highlights || []).map((item) => `<li>${item}</li>`).join('')}
    </ul>
    <div class="meta-grid">
      <div class="meta-tile">
        <div class="meta-label">Best time</div>
        <div>${poi.bestTime || 'Anytime'}</div>
      </div>
      <div class="meta-tile">
        <div class="meta-label">Area</div>
        <div>${poi.area || 'City center'}</div>
      </div>
      <div class="meta-tile">
        <div class="meta-label">Address</div>
        <div>${poi.address || 'No address available'}</div>
      </div>
      <div class="meta-tile">
        <div class="meta-label">Location</div>
        <div>${poi.location ? `${poi.location.lat.toFixed(4)}, ${poi.location.lng.toFixed(4)}` : 'Pin unavailable'}</div>
      </div>
    </div>
    <div class="pill-row" aria-label="Tags">${createTags(poi.tags)}</div>
  `;

  return wrapper;
};
