import { initMap } from "./map/map.js";
import { setStatus, renderPlacesList, openDetail, wireDetailClose } from "./ui/render.js";
import { readTripForm, wireForm } from "./ui/panel.js";
import { researchPlaces } from "./api/client.js";

let mapApi = null;
let currentPlaces = [];

async function runResearch(trip, options){
  setStatus("Researching…");
  const res = await researchPlaces(trip, options);
  currentPlaces = res.places || [];

  renderPlacesList(currentPlaces, (place) => {
    mapApi?.flyToPlace(place);
    openDetail(place);
  });

  mapApi?.setPlaces(currentPlaces, (place) => {
    openDetail(place);
  });

  if (res.destination?.bbox) {
    mapApi?.fitToBbox(res.destination.bbox);
  } else if (currentPlaces.length) {
    mapApi?.fitToPlaces(currentPlaces);
  }

  setStatus(`Loaded ${currentPlaces.length} place(s).`);
}

async function main(){
  // Mapbox public token is safe in frontend; do NOT put OpenAI key here.
  const MAPBOX_TOKEN = window.__MAPBOX_TOKEN__ || "";

  if (!MAPBOX_TOKEN) {
    setStatus("Missing Mapbox token. Set window.__MAPBOX_TOKEN__ in index.html or inject via hosting.");
    console.warn("Mapbox token missing");
  }

  mapApi = initMap({
    containerId: "map",
    mapboxToken: MAPBOX_TOKEN,
    onPlaceClicked: (place) => openDetail(place),
  });

  wireDetailClose();

  wireForm("tripForm", async () => {
    const { trip, options } = readTripForm();
    try{
      await runResearch(trip, options);
    }catch(err){
      console.error(err);
      setStatus("Error. Check console and server logs.");
      alert(err?.message || "Request failed.");
    }
  });
}

main();
