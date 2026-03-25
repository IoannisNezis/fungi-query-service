# Fungi Query Service

A search interface for mushroom species, powered by Wikidata via the QLever SPARQL endpoint.

## Features

- Search fungi by Latin name or German synonym
- Multilingual results (German / English)
- Color-coded edibility badges (edible, poisonous, deadly, medicinal, psychoactive, etc.)
- Species images from Wikidata
- Dark / light theme with persistent preference

## Tech Stack

- TypeScript + Vite
- Tailwind CSS
- Wikidata SPARQL API (via QLever)
- Caddy (production file server)

## Development

```sh
npm install
npm run dev
```

## Production (Docker)

```sh
docker compose up --build
```

The container serves the built app via Caddy on port 80. The included `docker-compose.yml` is set up for use behind a Traefik reverse proxy.
