# train_model.py
import os
import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

# Paths
DATA_PATH = Path("data/loan.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "loan_approval_model.pkl"

# Load and clean CSV
def load_and_clean(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.rename(columns={c: c.strip() for c in df.columns}, inplace=True)
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip()
    return df

# Build pipeline
def build_pipeline():
    numeric_features = ["no_of_dependents", "income_annum", "loan_amount", "loan_term", "cibil_score"]
    categorical_features = ["education", "self_employed"]

    preprocess = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numeric_features)
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        class_weight="balanced"
    )

    pipe = Pipeline(steps=[("preprocess", preprocess), ("clf", clf)])
    return pipe, numeric_features + categorical_features

def main():
    assert DATA_PATH.exists(), f"CSV not found at {DATA_PATH}"
    df = load_and_clean(DATA_PATH)

    # Select features and target
    features = ["no_of_dependents", "education", "self_employed",
                "income_annum", "loan_amount", "loan_term", "cibil_score"]
    target = "loan_status"

    X = df[features].copy()
    y = (df[target].str.lower().str.strip() == "approved").astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model, used_features = build_pipeline()
    model.fit(X_train, y_train)

    # Predictions with probability threshold
    y_proba = model.predict_proba(X_test)[:, 1]
    threshold = 0.7
    y_pred = (y_proba >= threshold).astype(int)

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print("Accuracy:", round(acc, 4))
    print("ROC-AUC :", round(auc, 4))
    print("\nClassification report:\n", classification_report(y_test, y_pred, digits=3))

    # Save model and threshold
    joblib.dump({"pipeline": model, "features": used_features, "threshold": threshold}, MODEL_PATH)
    print(f"\nSaved model → {MODEL_PATH.resolve()}")

if __name__ == "__main__":
    main()