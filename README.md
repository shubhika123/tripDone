# tripDone 🧭

> Smart multi-modal travel intelligence. Find every route, compare every price, know exactly when to book.

## What it does
- Finds all routes between cities using flights, trains, cabs, and buses
- Labels routes: Cheapest / Fastest / Most Comfortable
- ML model predicts flight price trends — Book Now or Wait
- Train confidence score — shows which trains are reliably on time
- Delay alerts — if your train is late, alerts you to cancel your cab for free
- Price drop alerts via WhatsApp, SMS, or email
- Travel photo gallery organised by trip

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python), Celery, Redis |
| ML | XGBoost, scikit-learn, pandas |
| Database | Supabase (Postgres) + MongoDB Atlas |
| Notifications | Twilio (WhatsApp + SMS) + Resend (Email) |
| Deploy | Vercel (frontend) + Railway (backend) |

## Run locally
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install && npm run dev
```

## Team
- **Shubhika Jain** — Backend, ML
- **[Partner]** — Frontend, UI/UX
