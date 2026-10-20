# 💰 ExpenseAI — AI-Powered Expense Tracker

An intelligent full-stack expense tracker powered by **FastAPI** (Python), **ReactJS** with **Tailwind CSS**, and **Groq Cloud LLMs** (Llama 3.3) for instant receipt OCR parsing and automated categorization. Dual support for **MongoDB** and **PostgreSQL**.

---

## 🏗️ Architecture Overview

- **Backend**: Python 3.12+ with FastAPI, Pydantic v2, CORS middleware, Groq SDK, and asynchronous database drivers (Motor for MongoDB / SQLAlchemy + asyncpg for PostgreSQL).
- **Frontend**: React 19 with Vite, Tailwind CSS, Lucide icons, glassmorphism UI tokens, and modular services.

---

## ⚡ Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create & activate virtualenv
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows
# source venv/bin/activate     # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup (React + Tailwind CSS)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Local App: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Configuration
Configure your keys in `backend/.env`:
- `GROQ_API_KEY`: Groq Cloud API key for ultra-fast Llama 3 categorization & receipt parsing.
- `DATABASE_TYPE`: Switch between `mongodb` or `postgresql`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 Advait Nair.

