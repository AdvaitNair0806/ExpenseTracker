import pytest
import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from main import app
from app.core.storage import read_all_transactions, delete_transaction

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "service" in data

def test_get_summary():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_balance" in data
    assert "total_income" in data
    assert "total_expenses" in data
    assert "category_breakdown" in data
    assert round(data["total_income"] - data["total_expenses"], 2) == round(data["total_balance"], 2)

def test_transactions_crud():
    # 1. Create Manual Transaction
    new_tx = {
        "amount": 149.99,
        "category": "Entertainment",
        "vendor": "Pytest Cinema",
        "date": "2026-10-27",
        "notes": "Automated unit test transaction",
        "type": "expense"
    }
    create_res = client.post("/api/transactions/manual", json=new_tx)
    assert create_res.status_code == 201
    created = create_res.json()
    tx_id = created["id"]
    assert created["vendor"] == "Pytest Cinema"
    assert created["amount"] == 149.99

    try:
        # 2. Get Single Transaction
        get_res = client.get(f"/api/transactions/{tx_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == tx_id

        # 3. Filter Transactions
        filter_res = client.get("/api/transactions?type=expense&category=Entertainment")
        assert filter_res.status_code == 200
        items = filter_res.json()
        assert any(item["id"] == tx_id for item in items)

        # 4. Update Transaction
        update_payload = {"notes": "Updated note during test run"}
        update_res = client.put(f"/api/transactions/{tx_id}", json=update_payload)
        assert update_res.status_code == 200
        assert update_res.json()["notes"] == "Updated note during test run"

    finally:
        # 5. Delete Transaction
        del_res = client.delete(f"/api/transactions/{tx_id}")
        assert del_res.status_code == 204

        # Verify deletion
        verify_del = client.get(f"/api/transactions/{tx_id}")
        assert verify_del.status_code == 404

def test_ai_text_parsing():
    payload = {"note": "Paid 180 for cold coffee at Blue Tokai today"}
    response = client.post("/api/transactions/ai-text", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] > 0
    assert "id" in data
    # Clean up created transaction
    delete_transaction(data["id"])

def test_ai_receipt_parsing():
    # Generate in-memory receipt image
    img = Image.new("RGB", (300, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "Quick Mart Grocery", fill=(0, 0, 0))
    draw.text((10, 40), "Total: Rs 210.00", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("receipt.png", buf, "image/png")}
    response = client.post("/api/transactions/ai-receipt", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] > 0
    assert "id" in data
    # Clean up
    delete_transaction(data["id"])

def test_ai_chat_advisor():
    chat_payload = {
        "message": "Give me a quick 1-sentence tip on how to save money on food.",
        "history": []
    }
    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"].strip()) > 0
