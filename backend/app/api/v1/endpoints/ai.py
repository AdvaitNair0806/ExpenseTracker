from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Body, status
from pydantic import BaseModel, Field

from app.services.ai_service import (
    parse_transaction_text,
    parse_receipt_image,
    ai_service,
    AIServiceError
)

router = APIRouter()

# ------------------------------------------------------------------------------
# Request & Response Schemas
# ------------------------------------------------------------------------------
class ParseTransactionRequest(BaseModel):
    note: str = Field(..., example="Paid 450 for dinner at McDonald's yesterday")

class ParseTransactionResponse(BaseModel):
    amount: float
    category: str
    vendor: str
    date: str
    type: str
    notes: Optional[str] = None
    confidence: Optional[float] = 0.95

class ParseReceiptJsonRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string or data URI of the receipt image")

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@router.post(
    "/parse-transaction",
    response_model=ParseTransactionResponse,
    summary="Parse raw natural language note into structured transaction"
)
async def parse_note(payload: ParseTransactionRequest):
    """
    Takes a raw user note (e.g. 'Paid 450 for dinner at McDonald\'s') and uses
    a Groq Llama model with JSON mode to extract amount, category, vendor, date, and type.
    """
    try:
        result = parse_transaction_text(payload.note)
        return ParseTransactionResponse(
            amount=result.get("amount", 0.0),
            category=result.get("category", "Miscellaneous"),
            vendor=result.get("vendor", "Unknown Vendor"),
            date=result.get("date", ""),
            type=result.get("type", "expense"),
            notes=result.get("notes", payload.note),
            confidence=result.get("confidence", 0.95),
        )
    except AIServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/parse-receipt-upload",
    summary="Upload receipt image/screenshot and parse via Groq Vision Llama"
)
async def upload_receipt_image(file: UploadFile = File(...)):
    """
    Takes an uploaded receipt image or payment screenshot, sends it to a multimodal
    Llama model via Groq, and extracts total amount, vendor, date, and category.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        result = parse_receipt_image(content)
        return result
    except AIServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/parse-receipt-base64",
    summary="Parse receipt image from base64 string"
)
async def parse_receipt_base64(payload: ParseReceiptJsonRequest):
    """
    Accepts base64 encoded receipt image and extracts financial entities using Groq Multimodal.
    """
    try:
        result = parse_receipt_image(payload.image_base64)
        return result
    except AIServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# Backward compatibility aliases
@router.post("/suggest-category")
async def suggest_category(payload: Dict[str, Any] = Body(...)):
    description = payload.get("description", "")
    parsed = parse_transaction_text(description)
    return {
        "category": parsed.get("category", "Miscellaneous"),
        "confidence": parsed.get("confidence", 0.95),
        "reasoning": f"Identified vendor: {parsed.get('vendor')} for {parsed.get('type')}"
    }

@router.post("/scan-receipt")
async def scan_receipt(payload: Dict[str, Any] = Body(...)):
    raw_text = payload.get("raw_text", "")
    parsed = parse_transaction_text(raw_text)
    return {
        "merchant": parsed.get("vendor"),
        "total_amount": parsed.get("amount"),
        "date": parsed.get("date"),
        "suggested_category": parsed.get("category"),
        "line_items": [],
        "confidence_score": parsed.get("confidence", 0.9),
        "insights": f"Categorized as {parsed.get('category')} under {parsed.get('type')}."
    }
