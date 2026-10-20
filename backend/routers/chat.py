"""
Chat Router  –  POST /api/chat
Accepts a user query + optional conversation history, loads all transactions
from transactions.json as context, and streams a natural-language response
from the Groq Llama model acting as a personal financial advisor.
"""

import json
import logging
from datetime import datetime
from typing import List, Optional
from collections import defaultdict

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.storage import read_all_transactions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["AI Chat Advisor"])

# ── Groq SDK ──────────────────────────────────────────────────────────────────
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded from backend directory
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env", override=True)
load_dotenv(override=True)

try:
    from groq import Groq
    _GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    _GROQ_AVAILABLE = False


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not _GROQ_AVAILABLE or not api_key or api_key == "gsk_your_groq_api_key_here":
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Groq in chat router: {e}")
        return None


def get_chat_model() -> str:
    return os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's current query")
    history: Optional[List[ChatMessage]] = Field(
        default=[], description="Prior conversation turns for context"
    )


class ChatResponse(BaseModel):
    reply: str
    model: str
    tokens_used: Optional[int] = None


# ── Context builder ───────────────────────────────────────────────────────────

def _build_financial_context() -> str:
    """Reads transactions.json and converts it to a compact text summary
    that fits efficiently into the system prompt."""
    try:
        transactions = read_all_transactions()
    except Exception:
        return "No transaction data available."

    if not transactions:
        return "The user has no recorded transactions yet."

    total_income    = 0.0
    total_expenses  = 0.0
    cat_totals: dict[str, float] = defaultdict(float)
    monthly_totals: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    tx_lines = []

    for tx in transactions:
        amt = float(tx.amount)
        is_income = tx.type.lower() == "income"

        if is_income:
            total_income += amt
        else:
            total_expenses += amt
            cat_totals[tx.category] += amt

        # Monthly roll-up (YYYY-MM)
        month_key = str(tx.date)[:7] if tx.date else "unknown"
        if is_income:
            monthly_totals[month_key]["income"] += amt
        else:
            monthly_totals[month_key]["expenses"] += amt

        # Compact per-row line
        tx_lines.append(
            f"  [{tx.date}] {tx.type.upper():7s} | "
            f"₹{amt:>9.2f} | {tx.category:<22s} | {tx.vendor}"
            + (f" — {tx.notes}" if tx.notes else "")
        )

    balance = total_income - total_expenses

    # Category breakdown (sorted by spend)
    cat_sorted = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    cat_lines = [f"  • {cat}: ₹{amt:.2f}" for cat, amt in cat_sorted]

    # Monthly summary
    monthly_lines = [
        f"  • {m}: income=₹{d['income']:.2f}, expenses=₹{d['expenses']:.2f}, net=₹{d['income']-d['expenses']:.2f}"
        for m, d in sorted(monthly_totals.items(), reverse=True)
    ]

    today = datetime.now().strftime("%Y-%m-%d")

    context = f"""=== FINANCIAL CONTEXT (as of {today}) ===
NOTE: All currency figures are in Indian Rupees (INR, ₹).

OVERVIEW
  Total Income   : ₹{total_income:.2f}
  Total Expenses : ₹{total_expenses:.2f}
  Net Balance    : ₹{balance:.2f}
  Transactions   : {len(transactions)} records

EXPENSE BREAKDOWN BY CATEGORY
{chr(10).join(cat_lines) if cat_lines else "  No expense categories recorded."}

MONTHLY SUMMARY
{chr(10).join(monthly_lines) if monthly_lines else "  No monthly data."}

FULL TRANSACTION LEDGER
{chr(10).join(tx_lines)}

=== END FINANCIAL CONTEXT ==="""

    return context


SYSTEM_PROMPT_TEMPLATE = """\
You are ExpenseAI Advisor, a knowledgeable, friendly, and concise personal financial advisor.
All financial transactions and balances are strictly in Indian Rupees (INR, ₹).
You have real-time read access to the user's complete transaction history, shown below.
Answer questions thoughtfully using ONLY the data provided — never fabricate numbers.
When referencing amounts, always format them in Indian Rupees (e.g. ₹450 or ₹1,200.00).
Keep responses clear, structured and actionable. Use markdown bullet points or tables when helpful.
If asked something unrelated to personal finance, politely redirect.

{financial_context}"""


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with AI financial advisor using your real transaction data",
)
async def chat_with_advisor(payload: ChatRequest):
    """
    Accepts a user question + optional conversation history.
    Injects all transactions as system context and returns a Groq LLM response.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    # Build financial context from live transactions.json
    financial_context = _build_financial_context()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(financial_context=financial_context)

    # Compose message list: system → history → new user message
    messages = [{"role": "system", "content": system_prompt}]

    if payload.history:
        for msg in payload.history[-10:]:   # cap at last 10 turns to stay within token limits
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": payload.message.strip()})

    # ── Groq API call ──────────────────────────────────────────────────────────
    groq_client = get_groq_client()
    chat_model = get_chat_model()

    if not groq_client:
        # Graceful simulation fallback when no API key
        reply = _simulate_advisor_reply(payload.message, financial_context)
        return ChatResponse(reply=reply, model="simulation-fallback")

    try:
        completion = groq_client.chat.completions.create(
            model=chat_model,
            messages=messages,
            temperature=0.45,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content or "I couldn't generate a response."
        tokens = getattr(completion.usage, "total_tokens", None)
        return ChatResponse(reply=reply, model=chat_model, tokens_used=tokens)

    except Exception as e:
        logger.error(f"Groq chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI advisor unavailable: {str(e)}"
        )


# ── Simulation fallback (no Groq key) ────────────────────────────────────────

def _simulate_advisor_reply(query: str, context: str) -> str:
    q = query.lower()
    try:
        txns = read_all_transactions()
        expenses = [t for t in txns if t.type.lower() == "expense"]
        income_txns = [t for t in txns if t.type.lower() == "income"]
        total_exp = sum(float(t.amount) for t in expenses)
        total_inc = sum(float(t.amount) for t in income_txns)

        if any(w in q for w in ["food", "dining", "eat", "restaurant"]):
            food_total = sum(
                float(t.amount) for t in expenses
                if "food" in t.category.lower() or "dining" in t.category.lower()
            )
            return f"🍽️ You've spent **₹{food_total:.2f}** on Food & Dining so far. That's {food_total/total_exp*100:.1f}% of your total expenses." if total_exp else "No food expenses recorded yet."

        if any(w in q for w in ["largest", "biggest", "most expensive", "highest"]):
            if expenses:
                biggest = max(expenses, key=lambda t: float(t.amount))
                return f"💸 Your largest expense was **₹{float(biggest.amount):.2f}** at **{biggest.vendor}** ({biggest.category}) on {biggest.date}."
            return "No expenses recorded yet."

        if any(w in q for w in ["summarize", "summary", "overview", "total"]):
            return (
                f"📊 **Financial Summary**\n\n"
                f"- **Income:** ₹{total_inc:.2f} ({len(income_txns)} transactions)\n"
                f"- **Expenses:** ₹{total_exp:.2f} ({len(expenses)} transactions)\n"
                f"- **Net Balance:** ₹{total_inc - total_exp:.2f}\n\n"
                f"You're {'saving' if total_inc > total_exp else 'overspending'} by **₹{abs(total_inc - total_exp):.2f}**."
            )

        if any(w in q for w in ["category", "categories", "breakdown"]):
            from collections import defaultdict
            cats: dict[str, float] = defaultdict(float)
            for t in expenses:
                cats[t.category] += float(t.amount)
            lines = [f"- **{c}:** ₹{a:.2f}" for c, a in sorted(cats.items(), key=lambda x: x[1], reverse=True)]
            return "📂 **Spending by Category**\n\n" + "\n".join(lines) if lines else "No expense categories yet."

        return (
            f"I'm currently in simulation mode (no Groq API key configured). "
            f"Your balance is **₹{total_inc - total_exp:.2f}** with {len(txns)} transactions recorded. "
            f"Add your `GROQ_API_KEY` to the backend `.env` for full AI-powered responses!"
        )
    except Exception:
        return "I'm in simulation mode. Add your GROQ_API_KEY to the backend .env file for full functionality."
