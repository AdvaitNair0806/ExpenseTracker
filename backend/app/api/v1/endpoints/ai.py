from fastapi import APIRouter, HTTPException
from app.models.expense import (
    AIScanReceiptRequest,
    AIScanReceiptResponse,
    AICategorySuggestionRequest,
    AICategorySuggestionResponse,
)
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/suggest-category", response_model=AICategorySuggestionResponse)
async def suggest_category(payload: AICategorySuggestionRequest):
    """
    Given an expense title or merchant name, returns an AI-recommended category.
    """
    try:
        result = await ai_service.suggest_category(payload.description)
        return AICategorySuggestionResponse(
            category=result.get("category", "Miscellaneous"),
            confidence=float(result.get("confidence", 0.8)),
            reasoning=result.get("reasoning", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI categorization failed: {str(e)}")

@router.post("/scan-receipt", response_model=AIScanReceiptResponse)
async def scan_receipt(payload: AIScanReceiptRequest):
    """
    Parses receipt text or OCR dump using Groq AI into structured JSON.
    """
    try:
        raw_text = payload.raw_text or "Coffee Shop Espresso $4.50 Date: 2026-10-20"
        result = await ai_service.parse_receipt_text(raw_text)
        return AIScanReceiptResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Receipt parsing failed: {str(e)}")
