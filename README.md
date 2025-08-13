
# Loan Approval Prediction with Gemini AI Insights

This project is a **Loan Approval Prediction Web App** built with **Flask** and integrated with **Google Gemini 1.5 Flash API** to provide **AI-powered bank suggestions** based on the applicant's profile.

The app:
- Takes loan applicant details as input.
- Predicts whether the loan will likely be approved or rejected using a trained ML model.
- Generates **personalized bank recommendations** using Google's Gemini AI API.

---

## 📂 Project Structure

.
├── app.py                      # Main Flask app
├── models/
│   └── loan_approval_model.pkl # Trained ML model pipeline
├── templates/
│   ├── index.html              # Input form page
│   └── result.html             # Results display page
├── static/
│   └── css/styles.css          # Stylesheet
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (API key)
└── README.md                   # Documentation

---

## 🚀 Features
- **Loan Approval Prediction** using ML model.
- **Confidence score** for prediction.
- **Google Gemini AI** insights for bank recommendations.
- Simple and clean **Flask web interface**.

---

## 🛠️ Setup Instructions

Follow these steps to set up and run the project locally.

### 1️⃣ Clone the repository
git clone <your-repo-url>
cd <your-repo-folder>

### 2️⃣ Create and activate a Python virtual environment
# Create venv
python -m venv venv

# Activate venv
# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate

### 3️⃣ Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

### 4️⃣ Set up environment variables
Create a file named **.env** in the project root and add your Gemini API key:
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

⚠️ Important: Never share your API key publicly.

### 5️⃣ Run the Flask app
python app.py

The app will start at:  
http://127.0.0.1:5000/

---

## 📋 Usage
1. Open the app in your browser.
2. Fill in the loan application form.
3. Submit to get:
   - Loan approval prediction.
   - Confidence score.
   - AI-generated bank suggestions.

---

## 🖥️ Sample Output

### ✅ Likely Approved
Loan Approval Result
Hi John Doe, here’s your result.

✅ Likely Approved
Model confidence: 82.35%

Summary:
Dependents: 1
Education: Graduate
Self Employed: No
Annual Income: ₹ 850,000
Loan Amount: ₹ 200,000
Loan Term: 60 months
CIBIL Score: 780

Gemini Insights:
1. HDFC Bank – Strong approval rate for high CIBIL scores.
2. ICICI Bank – Flexible repayment terms.
3. Axis Bank – Competitive interest rates for salaried applicants.

---

### ❌ Likely Rejected
Loan Approval Result
Hi Jane Smith, here’s your result.

❌ Likely Rejected
Model confidence: 35.12%

Summary:
Dependents: 3
Education: Not Graduate
Self Employed: Yes
Annual Income: ₹ 300,000
Loan Amount: ₹ 500,000
Loan Term: 36 months
CIBIL Score: 550

Gemini Insights:
1. State Bank of India – Offers secured loans for low credit scores.
2. Bank of Baroda – May approve with guarantor.
3. Canara Bank – Special schemes for self-employed individuals.

---

## 📌 Notes
- The ML model is stored in `models/loan_approval_model.pkl`.
- The Google Gemini API is used to generate the bank suggestions dynamically based on applicant profile.
