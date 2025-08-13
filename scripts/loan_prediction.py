import pandas as pd
import pickle
import numpy as np
import sys
import json
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

def preprocess_data(data):
    """
    Preprocess the input data to match the format expected by the trained model
    """
    # Create DataFrame from input data
    df = pd.DataFrame([data])
    
    # Handle categorical variables - encode them as they were during training
    # Gender: Male=1, Female=0
    df['Gender'] = df['Gender'].map({'Male': 1, 'Female': 0})
    
    # Married: Yes=1, No=0
    df['Married'] = df['Married'].map({'Yes': 1, 'No': 0})
    
    # Dependents: Convert to numeric, handle 3+ as 3
    df['Dependents'] = df['Dependents'].replace('3+', '3').astype(int)
    
    # Education: Graduate=1, Not Graduate=0
    df['Education'] = df['Education'].map({'Graduate': 1, 'Not Graduate': 0})
    
    # Self_Employed: Yes=1, No=0
    df['Self_Employed'] = df['Self_Employed'].map({'Yes': 1, 'No': 0})
    
    # Property_Area: Urban=2, Semiurban=1, Rural=0
    df['Property_Area'] = df['Property_Area'].map({'Urban': 2, 'Semiurban': 1, 'Rural': 0})
    
    # Handle missing values
    df = df.fillna(0)
    
    # Ensure all columns are numeric
    numeric_columns = ['ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term', 'Credit_History']
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Create derived features that might have been used during training
    df['TotalIncome'] = df['ApplicantIncome'] + df['CoapplicantIncome']
    df['LoanAmountLog'] = np.log(df['LoanAmount'] + 1)
    df['TotalIncomeLog'] = np.log(df['TotalIncome'] + 1)
    
    return df

def load_model():
    """
    Load the trained model from pickle file
    """
    try:
        with open('model.pkl', 'rb') as file:
            model = pickle.load(file)
        return model
    except FileNotFoundError:
        print(json.dumps({"error": "Model file not found. Please ensure model.pkl is in the project root."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Error loading model: {str(e)}"}))
        sys.exit(1)

def make_prediction(model, processed_data):
    """
    Make prediction using the loaded model
    """
    try:
        # Get the feature columns that the model expects
        # This might need adjustment based on your specific model
        expected_features = [
            'Gender', 'Married', 'Dependents', 'Education', 'Self_Employed',
            'ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term',
            'Credit_History', 'Property_Area', 'TotalIncome', 'LoanAmountLog', 'TotalIncomeLog'
        ]
        
        # Select only the features the model expects
        X = processed_data[expected_features]
        
        # Make prediction
        prediction = model.predict(X)[0]
        
        # Get prediction probability if available
        try:
            prediction_proba = model.predict_proba(X)[0]
            probability = float(max(prediction_proba))
        except:
            probability = 0.8 if prediction == 1 else 0.2
        
        return {
            "prediction": int(prediction),
            "probability": round(probability, 3)
        }
        
    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

def main():
    try:
        # Read input data from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Preprocess the data
        processed_data = preprocess_data(input_data)
        
        # Load the model
        model = load_model()
        
        # Make prediction
        result = make_prediction(model, processed_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
