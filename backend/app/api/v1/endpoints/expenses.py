from typing import List
from datetime import datetime
import uuid
from fastapi import APIRouter, HTTPException, status
from app.models.expense import ExpenseCreate, ExpenseResponse

router = APIRouter()

# In-memory storage for demonstration / initial testing before DB setup
DEMO_EXPENSES: List[dict] = [
    {
        "id": "exp_01",
        "title": "Grocery Run at Whole Foods",
        "amount": 78.45,
        "category": "Food & Dining",
        "date": datetime(2026, 10, 18, 14, 30),
        "notes": "Weekly groceries and organic produce",
        "payment_method": "Credit Card",
        "is_recurring": False,
        "created_at": datetime(2026, 10, 18, 14, 30),
    },
    {
        "id": "exp_02",
        "title": "Monthly Cloud Server",
        "amount": 24.00,
        "category": "Housing & Utilities",
        "date": datetime(2026, 10, 15, 9, 0),
        "notes": "VPS subscription",
        "payment_method": "Debit Card",
        "is_recurring": True,
        "created_at": datetime(2026, 10, 15, 9, 0),
    },
    {
        "id": "exp_03",
        "title": "Uber to Airport",
        "amount": 34.20,
        "category": "Transportation",
        "date": datetime(2026, 10, 12, 18, 15),
        "notes": "Terminal 2 ride",
        "payment_method": "Credit Card",
        "is_recurring": False,
        "created_at": datetime(2026, 10, 12, 18, 15),
    },
    {
        "id": "exp_04",
        "title": "Netflix Premium",
        "amount": 19.99,
        "category": "Entertainment",
        "date": datetime(2026, 10, 10, 12, 0),
        "notes": "Family streaming subscription",
        "payment_method": "Credit Card",
        "is_recurring": True,
        "created_at": datetime(2026, 10, 10, 12, 0),
    }
]

@router.get("/", response_model=List[ExpenseResponse])
async def list_expenses():
    """Retrieve all expenses."""
    return DEMO_EXPENSES

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(expense: ExpenseCreate):
    """Add a new expense."""
    new_expense = {
        "id": f"exp_{uuid.uuid4().hex[:8]}",
        "created_at": datetime.utcnow(),
        **expense.model_dump()
    }
    DEMO_EXPENSES.insert(0, new_expense)
    return new_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: str):
    """Delete an expense by ID."""
    global DEMO_EXPENSES
    initial_len = len(DEMO_EXPENSES)
    DEMO_EXPENSES = [e for e in DEMO_EXPENSES if e["id"] != expense_id]
    if len(DEMO_EXPENSES) == initial_len:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None
