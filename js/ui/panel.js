export function wireForm(formId, onSubmit){
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await onSubmit();
  });
}

export function readTripForm(){
  const destination_query = document.getElementById("destination").value.trim();
  const interestsRaw = document.getElementById("interests").value.trim();
  const ask = document.getElementById("ask").value.trim();
  const max_places = clampInt(document.getElementById("maxPlaces").value, 5, 25, 15);

  const interests = interestsRaw
    ? interestsRaw.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const trip = {
    destination_query,
    interests,
    pace: "moderate",
    ask: ask || `Find ${max_places} places and neighborhoods worth pinning on a map.`
  };

  const options = { max_places };

  return { trip, options };
}

function clampInt(v, min, max, fallback){
  const n = Number.parseInt(v, 10);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
  return fallback;
}
