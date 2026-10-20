from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.models.transaction import Transaction, TransactionCreate, TransactionUpdate
from app.core.storage import (
    read_all_transactions,
    append_transaction,
    delete_transaction,
    get_transaction_by_id,
    update_transaction,
)

router = APIRouter()

@router.get("/", response_model=List[Transaction], summary="Read all transactions")
async def list_transactions(
    type: Optional[str] = Query(None, description="Filter by 'income' or 'expense'"),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """
    Reads transactions from the local JSON storage file with optional filtering.
    """
    records = read_all_transactions()
    if type:
        records = [tx for tx in records if tx.type == type.lower()]
    if category:
        records = [tx for tx in records if tx.category.lower() == category.lower()]
    return records

@router.get("/{transaction_id}", response_model=Transaction, summary="Get transaction by ID")
async def get_transaction(transaction_id: str):
    """
    Finds a transaction by ID.
    """
    tx = get_transaction_by_id(transaction_id)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found"
        )
    return tx

@router.post("/", response_model=Transaction, status_code=status.HTTP_201_CREATED, summary="Append a new transaction")
async def create_transaction(payload: TransactionCreate):
    """
    Appends a new transaction to the local JSON storage file.
    """
    return append_transaction(payload)

@router.put("/{transaction_id}", response_model=Transaction, summary="Update a transaction")
async def edit_transaction(transaction_id: str, payload: TransactionUpdate):
    """
    Updates an existing transaction by ID.
    """
    updated = update_transaction(transaction_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found"
        )
    return updated

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a transaction")
async def remove_transaction(transaction_id: str):
    """
    Deletes a transaction from the local JSON storage file by ID.
    """
    deleted = delete_transaction(transaction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found"
        )
    return None
