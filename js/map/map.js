import { clearMarkers, addPlaceMarkers } from "./markers.js";

export function initMap({ containerId, mapboxToken, onPlaceClicked }){
  mapboxgl.accessToken = mapboxToken;

  const map = new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/dark-v11",
    center: [0, 20],
    zoom: 1.5,
  });

  map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

  let markers = [];

  function setPlaces(places, onClick){
    clearMarkers(markers);
    markers = addPlaceMarkers(map, places, (p) => {
      onClick?.(p);
      onPlaceClicked?.(p);
    });
  }

  function fitToPlaces(places){
    const coords = (places || [])
      .filter(p => typeof p.lng === "number" && typeof p.lat === "number")
      .map(p => [p.lng, p.lat]);

    if (coords.length < 2) {
      if (coords.length === 1) map.flyTo({ center: coords[0], zoom: 12 });
      return;
    }

    const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 900 });
  }

  function fitToBbox(bbox){
    // bbox expected [minLng, minLat, maxLng, maxLat]
    if (!Array.isArray(bbox) || bbox.length !== 4) return;
    const bounds = new mapboxgl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
    map.fitBounds(bounds, { padding: 70, maxZoom: 12, duration: 900 });
  }

  function flyToPlace(place){
    if (typeof place.lng !== "number" || typeof place.lat !== "number") return;
    map.flyTo({ center: [place.lng, place.lat], zoom: 13, duration: 700 });
  }

  return { map, setPlaces, fitToPlaces, fitToBbox, flyToPlace };
}
