import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import state
import json
from sentence_transformers import util

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Khởi tạo Client
client = genai.Client(api_key=api_key) if api_key else None


def fallback_understand(text):
    return {
        "goal": "information_seeking",
        "confidence": 0.3,
        "requires_external_knowledge": True,
        "explanation": "Fallback mode - default to information seeking",
    }


def ask_gemini_to_understand(text):
    if not client:
        return fallback_understand(text)

    prompt = f"""
Bạn là một AI có nhiệm vụ HIỂU VẤN ĐỀ người dùng, không phải phân loại intent.

Câu người dùng:
\"{text}\"

Hãy phân tích và trả về JSON:
{{
  "goal": "...",
  "confidence": 0.0,
  "requires_external_knowledge": true/false,
  "explanation": "..."
}}

Goal hợp lệ:
- solve_numeric_problem
- analyze_data
- information_seeking
- learning_explanation
- decision_support
- unknown
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config={
                "temperature": 0,
                "response_mime_type": "application/json",
            },
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"[Gemini ERROR] {e}")
        return fallback_understand(text)
