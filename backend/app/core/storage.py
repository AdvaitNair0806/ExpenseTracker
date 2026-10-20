"""
File-based JSON storage utility for transactions.
Provides thread-safe read, append, delete, and lookup operations on data/transactions.json.
"""

import json
import os
import uuid
import threading
from pathlib import Path
from typing import List, Optional, Union, Dict, Any

from app.models.transaction import (
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    TransactionType
)

# Base directory for backend project
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"

# Re-entrant thread lock for concurrent file access safety
_file_lock = threading.RLock()


def _ensure_storage_exists() -> Path:
    """Ensures that the data directory and transactions.json file exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TRANSACTIONS_FILE.exists():
        with _file_lock:
            with open(TRANSACTIONS_FILE, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
    return TRANSACTIONS_FILE


def _load_raw_data() -> List[Dict[str, Any]]:
    """Loads raw transaction dictionary objects from transactions.json."""
    _ensure_storage_exists()
    with _file_lock:
        try:
            with open(TRANSACTIONS_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return []
                return json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            return []


def _save_raw_data(data: List[Dict[str, Any]]) -> None:
    """Atomically writes transaction dictionary objects to transactions.json."""
    _ensure_storage_exists()
    temp_file = TRANSACTIONS_FILE.with_suffix(".tmp")
    with _file_lock:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_file.replace(TRANSACTIONS_FILE)


# ==============================================================================
# Helper Functions for FastAPI Backend
# ==============================================================================

def read_all_transactions() -> List[Transaction]:
    """
    Reads all transactions from the local JSON storage file.

    Returns:
        List[Transaction]: List of validated Pydantic Transaction models.
    """
    raw_list = _load_raw_data()
    return [Transaction(**item) for item in raw_list]


# Alias for convenience
get_all_transactions = read_all_transactions


def get_transaction_by_id(transaction_id: str) -> Optional[Transaction]:
    """
    Finds a single transaction by its unique ID.

    Args:
        transaction_id: Unique transaction ID string.

    Returns:
        Optional[Transaction]: The matching Transaction model, or None if not found.
    """
    raw_list = _load_raw_data()
    for item in raw_list:
        if item.get("id") == transaction_id:
            return Transaction(**item)
    return None


def append_transaction(transaction: Union[TransactionCreate, Transaction, Dict[str, Any]]) -> Transaction:
    """
    Appends a new transaction record to transactions.json.

    Args:
        transaction: TransactionCreate, Transaction, or raw dict.
                     If 'id' is omitted, a unique ID is automatically generated.

    Returns:
        Transaction: The persisted Transaction instance.
    """
    if isinstance(transaction, dict):
        tx_data = transaction.copy()
        if not tx_data.get("id"):
            tx_data["id"] = f"tx_{uuid.uuid4().hex[:8]}"
        tx_obj = Transaction(**tx_data)
    elif isinstance(transaction, TransactionCreate):
        tx_dict = transaction.model_dump()
        if not tx_dict.get("id"):
            tx_dict["id"] = f"tx_{uuid.uuid4().hex[:8]}"
        tx_obj = Transaction(**tx_dict)
    elif isinstance(transaction, Transaction):
        tx_obj = transaction
    else:
        raise ValueError("Invalid transaction format provided to append_transaction")

    with _file_lock:
        raw_list = _load_raw_data()
        raw_list.insert(0, tx_obj.model_dump())  # Prepend newest transactions
        _save_raw_data(raw_list)

    return tx_obj


# Alias for convenience
add_transaction = append_transaction


def delete_transaction(transaction_id: str) -> bool:
    """
    Deletes a transaction by its ID from transactions.json.

    Args:
        transaction_id: ID of the transaction to delete.

    Returns:
        bool: True if a transaction was found and deleted, False otherwise.
    """
    with _file_lock:
        raw_list = _load_raw_data()
        initial_length = len(raw_list)
        filtered_list = [item for item in raw_list if item.get("id") != transaction_id]

        if len(filtered_list) == initial_length:
            return False

        _save_raw_data(filtered_list)
        return True


def update_transaction(
    transaction_id: str,
    updates: Union[TransactionUpdate, Dict[str, Any]]
) -> Optional[Transaction]:
    """
    Updates fields of an existing transaction in transactions.json.

    Args:
        transaction_id: ID of the transaction to update.
        updates: TransactionUpdate model or dict containing updated fields.

    Returns:
        Optional[Transaction]: The updated Transaction model, or None if not found.
    """
    if isinstance(updates, TransactionUpdate):
        update_data = updates.model_dump(exclude_unset=True)
    else:
        update_data = {k: v for k, v in updates.items() if v is not None}

    with _file_lock:
        raw_list = _load_raw_data()
        for idx, item in enumerate(raw_list):
            if item.get("id") == transaction_id:
                updated_item = {**item, **update_data}
                # Validate updated item against schema
                validated_tx = Transaction(**updated_item)
                raw_list[idx] = validated_tx.model_dump()
                _save_raw_data(raw_list)
                return validated_tx

    return None
