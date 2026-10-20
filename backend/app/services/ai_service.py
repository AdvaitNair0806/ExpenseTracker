import json
from typing import Optional, Dict, Any
from app.core.config import settings

try:
    from groq import Groq
except ImportError:
    Groq = None

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client = None
        if self.api_key and self.api_key != "gsk_your_groq_api_key_here" and Groq:
            self.client = Groq(api_key=self.api_key)

    async def suggest_category(self, description: str) -> Dict[str, Any]:
        """
        Uses Groq LLM to automatically categorize an expense from its description.
        """
        if not self.client:
            # Fallback mock for initial setup when GROQ_API_KEY is not yet provided
            desc_lower = description.lower()
            if any(w in desc_lower for w in ["uber", "taxi", "gas", "flight", "metro", "train"]):
                return {"category": "Transportation", "confidence": 0.92, "reasoning": "Keyword match (mock mode)"}
            elif any(w in desc_lower for w in ["starbucks", "coffee", "restaurant", "burger", "pizza", "food", "grocery"]):
                return {"category": "Food & Dining", "confidence": 0.95, "reasoning": "Keyword match (mock mode)"}
            elif any(w in desc_lower for w in ["netflix", "spotify", "movie", "steam", "game"]):
                return {"category": "Entertainment", "confidence": 0.90, "reasoning": "Keyword match (mock mode)"}
            elif any(w in desc_lower for w in ["amazon", "walmart", "target", "shoes", "clothes"]):
                return {"category": "Shopping", "confidence": 0.88, "reasoning": "Keyword match (mock mode)"}
            return {"category": "Miscellaneous", "confidence": 0.70, "reasoning": "Default category (mock mode)"}

        prompt = f"""
        You are an intelligent financial assistant. Given the expense description below, determine the most appropriate category.
        Standard categories: Food & Dining, Transportation, Housing & Utilities, Entertainment, Healthcare, Shopping, Travel, Education, Personal Care, Miscellaneous.
        
        Expense description: "{description}"

        Return strictly valid JSON with keys: "category", "confidence" (number between 0 and 1), "reasoning".
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    async def parse_receipt_text(self, raw_text: str) -> Dict[str, Any]:
        """
        Extracts merchant, total, date, and line items from receipt OCR text.
        """
        if not self.client:
            return {
                "merchant": "Sample Store",
                "total_amount": 42.50,
                "date": "2026-10-20",
                "suggested_category": "Food & Dining",
                "line_items": [{"name": "Item 1", "price": 20.00}, {"name": "Item 2", "price": 22.50}],
                "confidence_score": 0.90,
                "insights": "Groq API Key is not configured yet. Providing simulated receipt analysis."
            }

        prompt = f"""
        Extract financial receipt data from the following text into JSON format:
        Keys required:
        - "merchant": name of store or merchant
        - "total_amount": float total price
        - "date": YYYY-MM-DD or string date
        - "suggested_category": primary spending category
        - "line_items": list of {{"name": string, "price": float}}
        - "confidence_score": float 0.0 to 1.0
        - "insights": short 1-sentence tip about this expense

        Receipt Text:
        \"\"\"{raw_text}\"\"\"
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

ai_service = AIService()
