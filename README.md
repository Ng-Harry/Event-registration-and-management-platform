# SmartMart (PRD v2.0 scaffold)

This repository now includes an initial multi-service scaffold aligned to the current PRD direction:

- `apps/web`: React + Vite POS shell with **offline/online detection** and **auto-sync** of queued sales.
- `apps/backend`: Node.js + Fastify API service for transactional endpoints.
- `apps/ai_service`: Python FastAPI service for AI/forecast endpoints.

## Offline + Sync behavior
The web POS shell:
1. Detects network status using browser `online/offline` events.
2. Queues sales to `localStorage` while offline.
3. Automatically syncs queued sales to backend when internet returns.

## Quick start

### Web
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/backend
npm install
npm run dev
```

### AI Service
```bash
cd apps/ai_service
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```
