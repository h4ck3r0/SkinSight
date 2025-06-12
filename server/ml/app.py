import os
os.environ['NUMPY_EXPERIMENTAL_ARRAY_FUNCTION'] = '0'  # Fix for NumPy issue

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from flask import Flask, request, jsonify
from PIL import Image
import pickle
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

try:
    # Load class names
    with open('class_names.pkl', 'rb') as f:
        class_names = pickle.load(f)

    # Load model with CPU device
    device = torch.device('cpu')
    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(class_names))
    model.load_state_dict(torch.load('best_resnet50_model.pth', map_location=device))
    model.to(device)
    model.eval()

    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    model = None
    class_names = []

# Image transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
])

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not initialized'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if not file:
        return jsonify({'error': 'Empty file'}), 400

    try:
        # Load and preprocess image
        img = Image.open(file.stream).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            prediction = class_names[predicted.item()]

        return jsonify({
            'prediction': prediction,
            'confidence': float(confidence.item())
        })
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    if model is None:
        return jsonify({'status': 'unhealthy', 'error': 'Model not loaded'}), 500
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)