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
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)  # Allow all origins


try:
    with open('class_names.pkl', 'rb') as f:
        class_names = pickle.load(f)

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


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Skinsight ML API is up and running 🚀'}), 200

@app.route('/health', methods=['GET'])
def health_check():
    if model is None:
        return jsonify({'status': 'unhealthy', 'error': 'Model not loaded'}), 500
    return jsonify({'status': 'healthy'}), 200

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
