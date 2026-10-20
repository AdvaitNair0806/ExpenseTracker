"""
Groq AI Service Module for Expense Tracker
Provides natural language transaction parsing and multimodal receipt OCR extraction
using Groq Cloud Llama models.
"""

import os
import re
import json
import base64
import logging
from datetime import datetime
from typing import Dict, Any, Union, Optional
from pathlib import Path

from dotenv import load_dotenv

# Preload environment variables from .env
load_dotenv()

logger = logging.getLogger(__name__)

# Import Groq SDK
try:
    from groq import Groq, APIConnectionError, RateLimitError, APIStatusError
except ImportError:
    Groq = None
    APIConnectionError = RateLimitError = APIStatusError = Exception


class AIServiceError(Exception):
    """Custom exception raised for AI service errors."""
    pass


class AIService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.text_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.vision_model = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initializes the Groq client if a valid key is provided."""
        if Groq and self.api_key and self.api_key != "gsk_your_groq_api_key_here":
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq client successfully initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")
                self.client = None
        else:
            self.client = None

    def is_configured(self) -> bool:
        """Checks if a valid Groq API key is present."""
        return bool(self.client is not None)

    @staticmethod
    def _clean_json_response(content: str) -> Dict[str, Any]:
        """
        Cleans and parses JSON output from LLM responses, stripping code fences or extra text.
        """
        if not content:
            raise AIServiceError("Empty response received from LLM.")

        cleaned = content.strip()
        # Remove Markdown backticks if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as err:
            # Fallback: attempt to find the first '{' and last '}'
            match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            raise AIServiceError(f"Failed to parse model output into JSON: {str(err)} - Content: {content[:200]}")

    @staticmethod
    def _detect_image_mime(image_bytes: bytes) -> str:
        """Detects image mime type from header bytes."""
        if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif image_bytes.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
            return "image/webp"
        elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
            return "image/gif"
        return "image/jpeg"

    # ==========================================================================
    # 1. Natural Language Transaction Parser
    # ==========================================================================
    def parse_transaction_text(self, note: str) -> Dict[str, Any]:
        """
        Takes a raw user note (e.g., 'Paid 450 for dinner at McDonald's') and uses
        a Llama model via Groq with JSON mode to extract: amount, category, vendor, date, and type.

        Args:
            note (str): Raw natural language note from the user.

        Returns:
            Dict[str, Any]: Structured dictionary with keys:
                - amount (float)
                - category (str)
                - vendor (str)
                - date (str: YYYY-MM-DD)
                - type (str: "expense" | "income")
                - notes (str)
                - confidence (float)
        """
        if not note or not note.strip():
            raise ValueError("Input note cannot be empty.")

        today_str = datetime.now().strftime("%Y-%m-%d")

        # Fallback simulation if Groq API key is not configured
        if not self.client:
            return self._simulate_text_parse(note, today_str)

        system_prompt = f"""
You are an expert financial transaction parsing assistant.
Analyze the user's input note and extract structured transaction details into strict JSON.

Current Context:
- Today's date is: {today_str}
- Standard Categories: Food & Dining, Groceries, Transportation, Housing & Utilities, Entertainment, Healthcare, Shopping, Travel, Education, Personal Care, Salary, Freelance, Investment, Miscellaneous.
- Transaction Types:
  * "expense": money paid out, spent, bought, charged, subscribed.
  * "income": money received, earned, deposit, salary, dividend, refund, payment received.

Required Output Schema (JSON only):
{{
  "amount": <float, positive numerical amount. If currency symbol like $ or ₹ is present, strip it and return pure number. If unknown, set to 0.0>,
  "category": <string, best fitting category name>,
  "vendor": <string, merchant or entity name, e.g. 'McDonald\'s', 'Uber', 'Employer'>,
  "date": <string, YYYY-MM-DD format. Resolve relative terms like 'today', 'yesterday', 'last Monday' relative to {today_str}>,
  "type": <string, strictly either "expense" or "income">,
  "notes": <string, brief concise note summarizing the item>,
  "confidence": <float between 0.0 and 1.0>
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.text_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Parse this transaction note: \"{note.strip()}\""}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=500,
            )

            raw_content = response.choices[0].message.content
            parsed = self._clean_json_response(raw_content)

            # Sanitize and ensure types
            amount_val = float(parsed.get("amount", 0.0))
            parsed["amount"] = abs(amount_val)
            parsed["category"] = str(parsed.get("category", "Miscellaneous")).strip()
            parsed["vendor"] = str(parsed.get("vendor", "Unknown Vendor")).strip()
            parsed["date"] = str(parsed.get("date", today_str)).strip()
            
            # Normalize type to 'expense' or 'income'
            tx_type = str(parsed.get("type", "expense")).lower().strip()
            parsed["type"] = "income" if "income" in tx_type or "salary" in tx_type else "expense"
            
            parsed["notes"] = str(parsed.get("notes", note.strip())).strip()
            parsed["confidence"] = float(parsed.get("confidence", 0.95))

            return parsed

        except (APIConnectionError, RateLimitError, APIStatusError) as groq_err:
            logger.error(f"Groq API error during text parsing: {groq_err}")
            raise AIServiceError(f"Groq API connection or rate limit error: {str(groq_err)}")
        except Exception as e:
            logger.error(f"Unexpected error during transaction text parsing: {e}")
            raise AIServiceError(f"Transaction parsing failed: {str(e)}")

    # ==========================================================================
    # 2. Multimodal Receipt Image Parser
    # ==========================================================================
    def parse_receipt_image(self, image_input: Union[bytes, str, Path]) -> Dict[str, Any]:
        """
        Takes an uploaded receipt image or payment screenshot, sends it to a multimodal
        Llama model via Groq, and extracts total amount, vendor, date, and category.

        Args:
            image_input (Union[bytes, str, Path]): Raw image bytes, base64 data string, or file path.

        Returns:
            Dict[str, Any]: Structured dictionary with keys:
                - amount (float) / total_amount (float)
                - vendor (str)
                - date (str: YYYY-MM-DD or string date)
                - category (str)
                - type (str: "expense")
                - line_items (list of {"name": str, "price": float})
                - tax (float or None)
                - confidence (float)
        """
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Normalize input to base64 data URI
        base64_data_uri, raw_bytes = self._prepare_image_uri(image_input)

        # Fallback simulation if Groq client is not configured
        if not self.client:
            return self._simulate_receipt_parse(today_str)

        system_prompt = f"""
You are a high-precision multimodal receipt and invoice analysis assistant.
Examine the receipt or payment screenshot image and extract all key transaction information into strict JSON.

Reference date (if year is omitted on receipt): {today_str}

Required Output Schema (JSON only):
{{
  "total_amount": <float, final total billed. Strip currency signs and return float>,
  "vendor": <string, name of the merchant, restaurant, or business>,
  "date": <string, date of purchase formatted as YYYY-MM-DD or best readable date>,
  "category": <string, one of: Food & Dining, Groceries, Shopping, Transportation, Housing & Utilities, Entertainment, Healthcare, Miscellaneous>,
  "type": "expense",
  "tax": <float or null, sales tax if indicated>,
  "line_items": [
    {{"name": <string>, "price": <float>}}
  ],
  "confidence": <float between 0.0 and 1.0>
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": system_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": base64_data_uri}
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=1000,
            )

            raw_content = response.choices[0].message.content
            parsed = self._clean_json_response(raw_content)

            # Ensure amount consistency across both amount and total_amount keys
            total_amt = parsed.get("total_amount") or parsed.get("amount") or 0.0
            try:
                total_amt = abs(float(total_amt))
            except (ValueError, TypeError):
                total_amt = 0.0

            parsed["total_amount"] = total_amt
            parsed["amount"] = total_amt
            parsed["vendor"] = str(parsed.get("vendor", "Unknown Vendor")).strip()
            parsed["date"] = str(parsed.get("date", today_str)).strip()
            parsed["category"] = str(parsed.get("category", "Food & Dining")).strip()
            parsed["type"] = "expense"
            parsed["line_items"] = parsed.get("line_items", [])
            parsed["confidence"] = float(parsed.get("confidence", 0.95))

            return parsed

        except (APIConnectionError, RateLimitError, APIStatusError) as groq_err:
            logger.error(f"Groq Vision API error: {groq_err}")
            raise AIServiceError(f"Groq Multimodal API error: {str(groq_err)}")
        except Exception as e:
            logger.error(f"Unexpected error during receipt image parsing: {e}")
            raise AIServiceError(f"Receipt image parsing failed: {str(e)}")

    def _prepare_image_uri(self, image_input: Union[bytes, str, Path]) -> tuple[str, bytes]:
        """Converts raw bytes, base64 strings, or file paths into a data URI."""
        if isinstance(image_input, (str, Path)) and os.path.exists(str(image_input)):
            with open(str(image_input), "rb") as f:
                raw_bytes = f.read()
            mime = self._detect_image_mime(raw_bytes)
            b64_str = base64.b64encode(raw_bytes).decode("utf-8")
            return f"data:{mime};base64,{b64_str}", raw_bytes

        elif isinstance(image_input, bytes):
            mime = self._detect_image_mime(image_input)
            b64_str = base64.b64encode(image_input).decode("utf-8")
            return f"data:{mime};base64,{b64_str}", image_input

        elif isinstance(image_input, str):
            if image_input.startswith("data:image/"):
                # Already a data URI
                try:
                    header, data = image_input.split(",", 1)
                    raw_bytes = base64.b64decode(data)
                except Exception:
                    raw_bytes = b""
                return image_input, raw_bytes
            else:
                # Raw base64 string
                try:
                    raw_bytes = base64.b64decode(image_input)
                    mime = self._detect_image_mime(raw_bytes)
                    return f"data:{mime};base64,{image_input}", raw_bytes
                except Exception as e:
                    raise ValueError(f"Invalid base64 image string: {e}")

        raise ValueError("Unsupported image input type. Provide raw bytes, base64 string, or valid file path.")

    # ==========================================================================
    # Mock / Fallback Simulators (for development without active Groq API Key)
    # ==========================================================================
    def _simulate_text_parse(self, note: str, today_str: str) -> Dict[str, Any]:
        """Provides simulated parsing when GROQ_API_KEY is not configured yet."""
        note_lower = note.lower()

        # Extract number if present
        amount_match = re.search(r"(\$|₹|€)?\s*([0-9]+(?:\.[0-9]{1,2})?)", note)
        amount = float(amount_match.group(2)) if amount_match else 25.00

        # Detect income vs expense
        is_income = any(w in note_lower for w in ["salary", "deposit", "earned", "received", "refund", "freelance"])
        tx_type = "income" if is_income else "expense"

        # Vendor extraction heuristic
        vendor = "Unknown Vendor"
        for v in ["McDonald's", "mcdonalds", "Starbucks", "Uber", "Amazon", "Walmart", "Whole Foods", "Netflix", "Spotify", "Apple"]:
            if v.lower() in note_lower:
                vendor = v
                break

        # Category determination
        if is_income:
            category = "Salary" if "salary" in note_lower else "Freelance"
        elif any(w in note_lower for w in ["mcdonald", "burger", "dinner", "lunch", "coffee", "starbucks", "food", "pizza"]):
            category = "Food & Dining"
        elif any(w in note_lower for w in ["uber", "taxi", "flight", "gas", "metro", "bus"]):
            category = "Transportation"
        elif any(w in note_lower for w in ["netflix", "spotify", "movie", "steam", "game"]):
            category = "Entertainment"
        elif any(w in note_lower for w in ["whole foods", "groceries", "supermarket", "trader joe"]):
            category = "Groceries"
        else:
            category = "Shopping"

        return {
            "amount": amount,
            "category": category,
            "vendor": vendor,
            "date": today_str,
            "type": tx_type,
            "notes": note.strip(),
            "confidence": 0.85,
            "_simulated": True,
            "_info": "Groq API key not configured in .env. Returned simulated parse."
        }

    def _simulate_receipt_parse(self, today_str: str) -> Dict[str, Any]:
        """Provides simulated receipt parsing when GROQ_API_KEY is not configured yet."""
        return {
            "total_amount": 42.50,
            "amount": 42.50,
            "vendor": "Trader Joe's",
            "date": today_str,
            "category": "Food & Dining",
            "type": "expense",
            "tax": 3.25,
            "line_items": [
                {"name": "Organic Milk", "price": 4.99},
                {"name": "Cold Brew Coffee", "price": 5.49},
                {"name": "Fresh Avocados", "price": 3.99},
                {"name": "Artisan Bread", "price": 4.50}
            ],
            "confidence": 0.90,
            "_simulated": True,
            "_info": "Groq API key not configured in .env. Returned simulated receipt parse."
        }


# Global Singleton Instance
ai_service = AIService()

# Top-level standalone helper functions
def parse_transaction_text(note: str) -> Dict[str, Any]:
    """Top-level functional interface to parse raw user transaction text."""
    return ai_service.parse_transaction_text(note)

def parse_receipt_image(image_input: Union[bytes, str, Path]) -> Dict[str, Any]:
    """Top-level functional interface to parse receipt or invoice images."""
    return ai_service.parse_receipt_image(image_input)
