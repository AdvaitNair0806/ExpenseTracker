# AI-Powered Expense Tracker - Backend

FastAPI backend providing high-performance REST APIs, Groq AI receipt analysis, intelligent expense categorization, and dual support for MongoDB and PostgreSQL.

## 🚀 Quickstart

### 1. Create and Activate Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
- Set `GROQ_API_KEY` with your key from [console.groq.com](https://console.groq.com).
- Choose `DATABASE_TYPE=mongodb` or `DATABASE_TYPE=postgresql` and provide connection credentials.

### 4. Run Development Server
```bash
uvicorn main:app --reload --port 8000
```
or run directly:
```bash
python main.py
```

### 5. Interactive API Documentation
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)
