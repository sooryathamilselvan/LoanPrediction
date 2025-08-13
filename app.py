import pickle

# Load the model
with open("model.pkl", "rb") as f:
    loaded_model = pickle.load(f)

# Use it for prediction
sample = [[5.1, 3.5, 1.4, 0.2]]
prediction = loaded_model.predict(sample)

print("Prediction:", prediction)
