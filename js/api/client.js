export async function researchPlaces(trip, options){
  const resp = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip, options })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`API error (${resp.status}): ${text || resp.statusText}`);
  }

  return resp.json();
}
