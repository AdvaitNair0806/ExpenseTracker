"""
FastAPI Router for Transactions and Summary
Path: routers/transactions.py (no authentication required)
Endpoints:
1. GET  /api/transactions          - Fetch all stored transactions from transactions.json
2. POST /api/transactions/manual   - Add a manual transaction directly to JSON
3. POST /api/transactions/ai-text  - Parse note via Groq Llama AI and save transaction
4. POST /api/transactions/ai-receipt - Parse image via Groq Vision Llama and save transaction
5. GET  /api/summary               - Total balance, income, expenses & category breakdown
"""

import base64
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body, status
from pydantic import BaseModel, Field, model_validator

from app.models.transaction import (
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    TransactionType
)
from app.core.storage import (
    read_all_transactions,
    append_transaction,
    delete_transaction,
    get_transaction_by_id,
    update_transaction
)
from services.ai_service import (
    parse_transaction_text,
    parse_receipt_image,
    AIServiceError
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Transactions & Summary"])


# ==============================================================================
# Request & Response Schemas
# ==============================================================================

class AITextNoteRequest(BaseModel):
    note: str = Field(..., description="Raw transaction text note", example="Paid 450 for dinner at McDonald's")

    @model_validator(mode="before")
    @classmethod
    def handle_text_or_note(cls, values):
        if isinstance(values, dict):
            # Support both 'note' and 'text' keys
            if "note" not in values and "text" in values:
                values["note"] = values["text"]
        return values


class CategoryDetail(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int


class FinancialSummaryResponse(BaseModel):
    total_balance: float = Field(..., description="Net balance = total_income - total_expenses", example=3145.55)
    total_income: float = Field(..., description="Sum of all income transactions", example=3650.00)
    total_expenses: float = Field(..., description="Sum of all expense transactions", example=504.45)
    category_breakdown: Dict[str, float] = Field(..., description="Expense totals grouped by category")
    category_details: Optional[List[CategoryDetail]] = Field(default=None, description="Detailed category percentage & count breakdown")
    transaction_count: int = Field(..., description="Total count of transactions", example=6)
    income_count: int = Field(..., description="Total count of income transactions", example=2)
    expense_count: int = Field(..., description="Total count of expense transactions", example=4)


# ==============================================================================
# 1. GET /api/transactions
# ==============================================================================
@router.get(
    "/transactions",
    response_model=List[Transaction],
    summary="Fetch all stored transactions from transactions.json"
)
async def get_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None
):
    """
    Fetches all transactions stored in data/transactions.json.
    Optional query filters:
    - `type`: filter by 'income' or 'expense'
    - `category`: filter by category name
    """
    try:
        transactions = read_all_transactions()
        if type:
            transactions = [t for t in transactions if t.type.lower() == type.lower()]
        if category:
            transactions = [t for t in transactions if t.category.lower() == category.lower()]
        return transactions
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read transactions: {str(e)}"
        )


# ==============================================================================
# 2. POST /api/transactions/manual
# ==============================================================================
@router.post(
    "/transactions/manual",
    response_model=Transaction,
    status_code=status.HTTP_201_CREATED,
    summary="Add a manual transaction directly to transactions.json"
)
async def create_manual_transaction(payload: TransactionCreate):
    """
    Adds a manual transaction directly to transactions.json with validation.
    Fields required:
    - amount: float (> 0)
    - category: string
    - vendor: string
    - date: string (YYYY-MM-DD)
    - notes: string (optional)
    - type: 'income' or 'expense'
    """
    try:
        saved_transaction = append_transaction(payload)
        return saved_transaction
    except Exception as e:
        logger.error(f"Error creating manual transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not save manual transaction: {str(e)}"
        )


# ==============================================================================
# 3. POST /api/transactions/ai-text
# ==============================================================================
@router.post(
    "/transactions/ai-text",
    response_model=Transaction,
    status_code=status.HTTP_201_CREATED,
    summary="Parse raw natural language note with Groq Llama and save transaction"
)
async def create_ai_text_transaction(payload: AITextNoteRequest):
    """
    Accepts a raw natural language note (e.g. 'Paid 450 for dinner at McDonald\'s'),
    passes it through the Groq Llama AI service in JSON mode to extract:
    amount, category, vendor, date, and type, and then persists it directly
    to transactions.json.
    """
    if not payload.note or not payload.note.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note field cannot be empty."
        )

    try:
        # Call Groq AI transaction parser
        ai_result = parse_transaction_text(payload.note)

        # Build TransactionCreate schema from AI output
        transaction_data = TransactionCreate(
            amount=ai_result.get("amount", 0.0),
            category=ai_result.get("category", "Miscellaneous"),
            vendor=ai_result.get("vendor", "Unknown Vendor"),
            date=ai_result.get("date", datetime.now().strftime("%Y-%m-%d")),
            notes=payload.note.strip(),
            type=ai_result.get("type", "expense"),
        )

        saved = append_transaction(transaction_data)
        return saved

    except AIServiceError as e:
        logger.error(f"AI Service error in ai-text: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI parsing failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in ai-text transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and save transaction: {str(e)}"
        )


# ==============================================================================
# 4. POST /api/transactions/ai-receipt
# ==============================================================================
@router.post(
    "/transactions/ai-receipt",
    response_model=Transaction,
    status_code=status.HTTP_201_CREATED,
    summary="Extract receipt/screenshot with Groq Multimodal Vision and save transaction"
)
async def create_ai_receipt_transaction(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None)
):
    """
    Accepts an uploaded receipt image or payment screenshot (via multipart form upload
    or base64 string), passes it to Groq multimodal Llama vision, extracts total amount,
    vendor, date, and category, and saves the transaction to transactions.json.
    """
    image_bytes = None

    if file:
        image_bytes = await file.read()
    elif image_base64:
        # Handle data URI or raw base64
        try:
            if "," in image_base64:
                _, b64data = image_base64.split(",", 1)
            else:
                b64data = image_base64
            image_bytes = base64.b64decode(b64data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 image data: {str(e)}"
            )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No receipt image provided. Upload a file or provide image_base64."
        )

    try:
        # Call Groq Vision Multimodal Parser
        extracted = parse_receipt_image(image_bytes)

        total_amount = extracted.get("total_amount") or extracted.get("amount") or 0.0
        line_items_count = len(extracted.get("line_items", []))
        auto_note = f"Scanned receipt ({line_items_count} items)" if line_items_count else "AI receipt scan"

        transaction_data = TransactionCreate(
            amount=abs(float(total_amount)),
            category=extracted.get("category", "Food & Dining"),
            vendor=extracted.get("vendor", "Unknown Vendor"),
            date=extracted.get("date", datetime.now().strftime("%Y-%m-%d")),
            notes=auto_note,
            type=extracted.get("type", "expense"),
        )

        saved = append_transaction(transaction_data)
        return saved

    except AIServiceError as e:
        logger.error(f"AI Vision service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Receipt analysis failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error parsing and saving receipt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process receipt: {str(e)}"
        )


# ==============================================================================
# 5. GET /api/summary
# ==============================================================================
@router.get(
    "/summary",
    response_model=FinancialSummaryResponse,
    summary="Calculate total balance, total income, total expenses, and category-wise breakdown"
)
async def get_summary():
    """
    Calculates summary metrics from the local transaction list in transactions.json:
    - Total balance (income - expenses)
    - Total income
    - Total expenses
    - Category-wise expense breakdown
    """
    try:
        transactions = read_all_transactions()

        total_income = 0.0
        total_expenses = 0.0
        income_count = 0
        expense_count = 0
        category_totals: Dict[str, float] = {}
        category_counts: Dict[str, int] = {}

        for tx in transactions:
            amt = float(tx.amount)
            if tx.type.lower() == "income":
                total_income += amt
                income_count += 1
            else:
                total_expenses += amt
                expense_count += 1
                cat = tx.category.strip() or "Miscellaneous"
                category_totals[cat] = category_totals.get(cat, 0.0) + amt
                category_counts[cat] = category_counts.get(cat, 0) + 1

        total_balance = total_income - total_expenses

        # Generate detailed percentage breakdown for expenses
        category_details: List[CategoryDetail] = []
        for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
            pct = round((amt / total_expenses * 100), 2) if total_expenses > 0 else 0.0
            category_details.append(
                CategoryDetail(
                    category=cat,
                    amount=round(amt, 2),
                    percentage=pct,
                    count=category_counts.get(cat, 0)
                )
            )

        # Clean dictionary rounding
        rounded_category_breakdown = {k: round(v, 2) for k, v in category_totals.items()}

        return FinancialSummaryResponse(
            total_balance=round(total_balance, 2),
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            category_breakdown=rounded_category_breakdown,
            category_details=category_details,
            transaction_count=len(transactions),
            income_count=income_count,
            expense_count=expense_count,
        )

    except Exception as e:
        logger.error(f"Error computing financial summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate financial summary: {str(e)}"
        )
