# Travel-App

Travel planning app with a lightweight Node server and a Leaflet front end.

## Getting started

1. Set your API key: `export OPENAI_API_KEY=your_key_here`
2. Run the server: `npm run start`
3. Open [http://localhost:3000](http://localhost:3000) to use the planner.

The `/api/plan` endpoint accepts a destination, optional dates, and interests, then returns a normalized POI list with geocoded coordinates suitable for the built-in map experience.
