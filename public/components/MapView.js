import { createPoiTooltip } from './PoiTooltip.js';
import { createPoiDetailCard } from './PoiDetailCard.js';

const CATEGORY_COLORS = {
  culture: '#f97316',
  nature: '#16a34a',
  food: '#e11d48',
  stay: '#9333ea',
  activity: '#2563eb',
  general: '#2563eb',
};

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export class MapView {
  constructor(mapElement, detailContainer, fallbackContainer) {
    this.mapElement = mapElement;
    this.detailContainer = detailContainer;
    this.fallbackContainer = fallbackContainer;
    this.markerLayer = null;
    this.activePoiId = null;
    this.markerMap = new Map();
    this.missingPinCount = 0;
    this.initMap(DEFAULT_CENTER);
  }

  initMap(center) {
    this.map = L.map(this.mapElement, { zoomControl: true }).setView(
      [center.lat, center.lng],
      12,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      crossOrigin: true,
    }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  clearMarkers() {
    this.markerLayer?.clearLayers();
    this.markerMap.clear();
  }

  updateData({ center, pois }) {
    if (!this.map) {
      this.initMap(center || DEFAULT_CENTER);
    }
    if (center?.lat && center?.lng) {
      this.map.flyTo([center.lat, center.lng], 12, { duration: 1.2 });
    }
    this.renderMarkers(pois || []);
    this.setFallbackMessage(pois || []);
    this.setActivePoi((pois || [])[0] || null);
  }

  renderMarkers(pois) {
    this.clearMarkers();
    const plotted = [];
    const missingPins = [];

    pois.forEach((poi) => {
      if (!poi.location) {
        missingPins.push(poi);
        return;
      }
      const marker = this.buildMarker(poi);
      plotted.push(marker);
    });

    if (plotted.length) {
      const group = L.featureGroup(plotted);
      const bounds = group.getBounds().pad(0.2);
      this.map.fitBounds(bounds, { maxZoom: 14 });
    }
    this.missingPinCount = missingPins.length;
  }

  buildMarker(poi) {
    const color = CATEGORY_COLORS[poi.category?.toLowerCase()] || CATEGORY_COLORS.general;
    const icon = L.divIcon({
      html: `<span class="marker-dot" style="background:${color}"></span>`,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      tooltipAnchor: [0, -18],
    });

    const marker = L.marker([poi.location.lat, poi.location.lng], {
      icon,
      keyboard: true,
      title: poi.name,
    });

    marker.bindTooltip(createPoiTooltip(poi), {
      direction: 'top',
      opacity: 0.95,
      interactive: true,
      className: 'poi-tooltip',
    });

    marker.on('mouseover', () => marker.openTooltip());
    marker.on('mouseout', () => marker.closeTooltip());
    marker.on('focus', () => marker.openTooltip());
    marker.on('blur', () => marker.closeTooltip());
    marker.on('click', () => this.setActivePoi(poi));
    marker.on('touchstart', () => this.setActivePoi(poi));
    marker.on('keypress', (event) => {
      const key = event.originalEvent?.key;
      if (key === 'Enter' || key === ' ') {
        this.setActivePoi(poi);
      }
    });
    marker.on('add', () => {
      const el = marker.getElement();
      if (el) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${poi.name} marker`);
      }
    });

    marker.addTo(this.markerLayer);
    this.markerMap.set(poi.id, marker);
    return marker;
  }

  setActivePoi(poi) {
    this.activePoiId = poi?.id || null;
    this.highlightMarker();
    if (!poi) {
      this.detailContainer.innerHTML = '<p class="muted">Submit a destination to see details.</p>';
      return;
    }
    this.detailContainer.innerHTML = '';
    this.detailContainer.appendChild(createPoiDetailCard(poi));
  }

  highlightMarker() {
    this.markerMap.forEach((marker, id) => {
      const el = marker.getElement();
      if (!el) return;
      if (id === this.activePoiId) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
  }

  setFallbackMessage(pois) {
    if (!this.fallbackContainer) return;
    if (!pois.length) {
      this.fallbackContainer.textContent =
        'No POIs yet—submit a destination to generate highlights.';
      return;
    }
    const availablePins = pois.filter((poi) => poi.location);
    if (!availablePins.length) {
      this.fallbackContainer.textContent =
        'POIs generated, but pins are unavailable due to missing coordinates.';
      return;
    }
    if (this.missingPinCount) {
      this.fallbackContainer.textContent = `${this.missingPinCount} pin${
        this.missingPinCount > 1 ? 's are' : ' is'
      } unavailable due to geocoding limits.`;
      return;
    }
    this.fallbackContainer.textContent = '';
  }
}
