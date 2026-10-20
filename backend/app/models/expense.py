from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ExpenseBase(BaseModel):
    title: str = Field(..., example="Starbucks Coffee")
    amount: float = Field(..., gt=0, example=4.75)
    category: str = Field(default="Uncategorized", example="Food & Dining")
    date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = Field(default=None, example="Morning latte")
    payment_method: Optional[str] = Field(default="Credit Card", example="Credit Card")
    is_recurring: bool = Field(default=False)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str = Field(..., example="exp_65f01ab98c")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class AIScanReceiptRequest(BaseModel):
    raw_text: Optional[str] = None
    image_url: Optional[str] = None

class AIScanReceiptResponse(BaseModel):
    merchant: Optional[str] = None
    total_amount: Optional[float] = None
    date: Optional[str] = None
    suggested_category: str = "General"
    line_items: List[dict] = Field(default_factory=list)
    confidence_score: float = 0.95
    insights: Optional[str] = None

class AICategorySuggestionRequest(BaseModel):
    description: str

class AICategorySuggestionResponse(BaseModel):
    category: str
    confidence: float
    reasoning: Optional[str] = None
