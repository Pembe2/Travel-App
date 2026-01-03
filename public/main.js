import { TripForm } from './components/TripForm.js';
import { MapView } from './components/MapView.js';

const mapElement = document.getElementById('map');
const detailContainer = document.getElementById('detail-card');
const fallbackContainer = document.getElementById('fallback');
const destinationTitle = document.getElementById('destination-title');
const bestTime = document.getElementById('best-time');
const inlineError = document.getElementById('inline-error');

const mapView = new MapView(mapElement, detailContainer, fallbackContainer);
fallbackContainer.textContent = 'No POIs yet—submit a destination to generate highlights.';

const handleSubmit = async (payload) => {
  inlineError.textContent = '';
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to generate a plan right now.');
    }

    destinationTitle.textContent = data.destination || payload.destination;
    bestTime.textContent = data.bestTimeToVisit
      ? `Best time to visit: ${data.bestTimeToVisit}`
      : '';

    if (!data.pois || !data.pois.length) {
      fallbackContainer.textContent =
        'No POIs returned. Try a more specific destination or broaden your interests.';
    }

    mapView.updateData(data);
  } catch (error) {
    inlineError.textContent = error.message;
    fallbackContainer.textContent = 'We could not render POIs. Please try again.';
  } finally {
    tripForm.setLoading(false);
  }
};

const tripForm = new TripForm(document.getElementById('trip-form'), handleSubmit);
