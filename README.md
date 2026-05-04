# SmartMart Full App Foundation (PRD v2)

This repository now contains a **functional full-app foundation** across core PRD modules:

- **Web/Desktop POS (React + Vite)** with online/offline detection and auto-sync queue.
- **Transactional Backend (Node.js + Fastify)** with inventory, sales, invoicing, wallet, and alerts endpoints.
- **AI Service (Python FastAPI)** for prediction endpoints.

## Implemented PRD module coverage
- **M1 POS:** sale capture endpoint + offline queue/sync in web app.
- **M2 Inventory:** product creation and inventory listing with onHand/reserved tracking.
- **M3 AI Engine (foundation):** stockout scan endpoint producing severity-tier alerts.
- **M6 Alerts:** alert feed endpoint.
- **M7 Wallet:** balance/ledger updates from sales & invoices, withdrawal endpoint.
- **M8 Invoicing:** invoice creation, stock reservation, payment handling, and stock decrement on full payment.

## Offline/Online behavior (desktop web app)
- Detects network state via browser online/offline events.
- Stores unsynced POS sales locally.
- Automatically retries and syncs queued sales when internet returns.

## Run locally

### Backend
```bash
cd apps/backend
npm install
npm run dev
```

### Web
```bash
cd apps/web
npm install
npm run dev
```

### AI service
```bash
cd apps/ai_service
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```
