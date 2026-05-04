# SmartMart PRD v2.0 — Stack Decision Update

## Final Recommendation
After reviewing your feedback, the best-fit implementation stack is:

- **Backend API:** **Node.js + Fastify**
- **Frontend (Web/Desktop POS):** **React + Vite**

## Why Node.js + Fastify is Best for the Backend
- **High-concurrency I/O:** POS, wallet, and webhook-heavy flows (Monnify/Paystack) benefit from Fastify's low-overhead request handling.
- **Excellent JSON API performance:** SmartMart is API-first, event-driven, and webhook-intensive.
- **Ecosystem fit for product APIs:** Strong support for auth, validation, queues, and observability in production retail systems.
- **Clear service boundary:** Keep **AI/ML inference in Python services** while business APIs remain in Node/Fastify.

## PRD Stack Direction (Updated)
Use the following baseline in the PRD:

- **Mobile/Tablet App:** React Native
- **Web/Desktop POS:** React + Vite
- **Backend API:** Node.js + Fastify
- **AI/ML Engine:** Python (FastAPI + Prophet + scikit-learn)
- **Cloud DB/Sync:** Supabase (PostgreSQL + Realtime)
- **Offline Local DB:** SQLite
- **Payments:** Monnify + Paystack

## Architecture Note
- Keep a **hybrid backend model**:
  - **Node.js + Fastify** for core transactional/business APIs (POS, inventory, wallet, invoicing, webhooks).
  - **Python FastAPI** for AI model serving only.
- This preserves operational speed for retail transactions while keeping ML tooling in its strongest ecosystem.
