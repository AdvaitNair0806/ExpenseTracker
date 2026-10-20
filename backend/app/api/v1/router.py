from fastapi import APIRouter
from app.api.v1.endpoints import expenses, ai, transactions

api_router = APIRouter()

api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions (JSON Storage)"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Intelligence"])

