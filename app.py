# app.py
import os
import joblib
import pandas as pd
from pathlib import Path
from flask import Flask, render_template, request
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    raise ValueError("❌ Missing GOOGLE_GENERATIVE_AI_API_KEY in .env file")
genai.configure(api_key=api_key)

app = Flask(__name__)
MODEL_PATH = Path("models/loan_approval_model.pkl")

# Load model once
artifact = joblib.load(MODEL_PATH)
model = artifact["pipeline"]
used_features = artifact["features"]

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

def to_int(val, default=0):
    try:
        return int(str(val).replace(",", "").strip())
    except Exception:
        return default

def to_float(val, default=0.0):
    try:
        return float(str(val).replace(",", "").strip())
    except Exception:
        return default

def _extract_gemini_text(response) -> str:
    """
    Robustly extract text from a Gemini response object.
    Falls back to iterating candidates/parts if response.text is empty.
    """
    try:
        if hasattr(response, "text") and response.text:
            return response.text

        parts_text = []
        if hasattr(response, "candidates") and response.candidates:
            for cand in response.candidates:
                content = getattr(cand, "content", None)
                parts = getattr(content, "parts", None) if content else None
                if parts:
                    for p in parts:
                        t = getattr(p, "text", None)
                        if t:
                            parts_text.append(t)
        text = "\n".join([t for t in parts_text if t]).strip()
        return text
    except Exception:
        return ""

@app.route("/predict", methods=["POST"])
def predict():
    # Collect form fields
    full_name = request.form.get("full_name", "").strip()

    # Used by model:
    no_of_dependents = to_int(request.form.get("dependents"))
    education = request.form.get("education", "Graduate").strip()
    self_employed = request.form.get("self_employed", "No").strip()

    monthly_income = to_float(request.form.get("monthly_income"))
    coapp_income = to_float(request.form.get("coapp_income"))
    income_annum = (monthly_income + coapp_income) * 12.0

    loan_amount = to_int(request.form.get("loan_amount"))
    loan_term = to_int(request.form.get("loan_term"))
    cibil_score = to_int(request.form.get("cibil_score"))

    # Build the dataframe expected by the pipeline
    row = {
        "no_of_dependents": no_of_dependents,
        "education": education,
        "self_employed": self_employed,
        "income_annum": income_annum,
        "loan_amount": loan_amount,
        "loan_term": loan_term,
        "cibil_score": cibil_score,
    }
    df = pd.DataFrame([row], columns=used_features)

    # Predict
    proba = float(model.predict_proba(df)[:, 1][0])
    approved = proba >= 0.5
    result_text = "Approved" if approved else "Rejected"

    # Ask Gemini for bank suggestions (Gemini 1.5 Flash)
    gemini_prompt = f"""
    You are a helpful loan officer assistant focused on India.
    The model's decision: {result_text} (probability {proba:.2f}).
    Applicant details (JSON): {row}

    Task:
    1) Suggest 3 Indian banks that are most likely to approve or consider this profile.
    2) Give a one-line reason for each suggestion (e.g., product fit, CIBIL tolerance, income-to-EMI ratio).
    3) Add a short tip to improve approval odds.
    Format as a short bulleted list. No disclaimers.
    """

    gemini_insight = ""
    try:
        gemini_model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config={
                "temperature": 0.3,
                "top_p": 0.9,
                "max_output_tokens": 512,
            },
        )
        gemini_response = gemini_model.generate_content(gemini_prompt)
        # Debug print to server console (optional)
        # print("RAW GEMINI RESPONSE:", gemini_response)

        extracted = _extract_gemini_text(gemini_response)
        gemini_insight = extracted if extracted else "No insight returned."
    except Exception as e:
        gemini_insight = f"Error fetching Gemini insight: {str(e)}"

    return render_template(
        "result.html",
        full_name=full_name or "Applicant",
        approved=approved,
        probability=round(proba * 100, 2),
        details=row,
        gemini_insight=gemini_insight,   # <-- match your template var name
    )

if __name__ == "__main__":
    # Run locally
    app.run(host="127.0.0.1", port=5000, debug=True)
