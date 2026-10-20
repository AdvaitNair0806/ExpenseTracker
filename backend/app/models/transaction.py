from enum import Enum
from typing import Optional, Literal
import uuid
from pydantic import BaseModel, Field

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction monetary amount (must be > 0)", example=42.50)
    category: str = Field(..., description="Transaction category name", example="Food & Dining")
    vendor: str = Field(..., description="Vendor or merchant name", example="Trader Joe's")
    date: str = Field(..., description="Transaction date in YYYY-MM-DD string format", example="2026-10-20")
    notes: str = Field(default="", description="Additional remarks or notes", example="Weekly grocery shopping")
    type: Literal["income", "expense"] = Field(..., description="Transaction type: income or expense", example="expense")

class TransactionCreate(TransactionBase):
    id: Optional[str] = Field(default=None, description="Optional ID; auto-generated if omitted", example="tx_12345678")

class Transaction(TransactionBase):
    id: str = Field(
        default_factory=lambda: f"tx_{uuid.uuid4().hex[:8]}",
        description="Unique transaction identifier",
        example="tx_e1a2b3c4"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "tx_e1a2b3c4",
                "amount": 78.45,
                "category": "Food & Dining",
                "vendor": "Whole Foods Market",
                "date": "2026-10-18",
                "notes": "Weekly groceries and organic produce",
                "type": "expense"
            }
        }

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    vendor: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
