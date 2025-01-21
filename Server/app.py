from flask import Flask, request, jsonify
import numpy as np
import requests
from PIL import Image
import io
from ibm_watson import TextToSpeechV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson import SpeechToTextV1
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

IMGTXT_API_KEY = "0ZMGeZzTgJ_lY9izPitQh4uXzeIr02Z9RSgVIq7YhpVO"
DEPLOYMENT_URL = "https://us-south.ml.cloud.ibm.com/ml/v4/deployments/97db027d-1bea-447a-89d4-253d1a011dff/predictions?version=2021-05-01"

def get_ibm_token():
    token_response = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={"apikey": IMGTXT_API_KEY, "grant_type": "urn:ibm:params:oauth:grant-type:apikey"},
    )
    return token_response.json().get("access_token")

def preprocess_image(image_file):
    image = Image.open(io.BytesIO(image_file.read())).convert("L")
    image = image.resize((28, 28))
    img_array = np.array(image).flatten().tolist()
    return img_array

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    image_file = request.files["image"]
    img_reshaped = preprocess_image(image_file)
    
    mltoken = get_ibm_token()
    headers = {"Authorization": f"Bearer {mltoken}", "Content-Type": "application/json"}
    
    payload_scoring = {"input_data": [{"fields": ["pixels"], "values": [img_reshaped]}]}
    
    response_scoring = requests.post(DEPLOYMENT_URL, json=payload_scoring, headers=headers)
    
    if response_scoring.status_code != 200:
        print(response_scoring.text)
        return jsonify({"error": "Failed to get prediction"}), 400
    
    response_json = response_scoring.json()
    probabilities = response_json["predictions"][0]["values"][0]
    predicted_class = np.argmax(probabilities)
    
    return jsonify({"predicted_class": predicted_class})

TXTSP_API_KEY = "QJM2EY7bhf2M15MloYBDhyny3TcWJRkNJ_xfM0MuxhVV"

authenticator = IAMAuthenticator(TXTSP_API_KEY)
text_to_speech = TextToSpeechV1(authenticator=authenticator)
text_to_speech.set_service_url('https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/218d8ce1-fd5f-4a54-b1f6-8ab82922458b')

@app.route("/synthesize", methods=["POST"])
def synthesize():
    data = request.get_json()
    if "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text_input = str(data.get("text", ""))
    
    response = text_to_speech.synthesize(
        text_input,
        voice='en-US_AllisonV3Voice',
        accept='audio/wav'        
    ).get_result().content
    
    return response, 200, {"Content-Type": "audio/wav"}


SPTXT_API_KEY = '0QFH8OG1ISh6QID0ywLXNTC9dyfsfVcIlPeN9ndby_c0'
authenticator = IAMAuthenticator(SPTXT_API_KEY)
speech_to_text = SpeechToTextV1(
    authenticator=authenticator
)

speech_to_text.set_service_url('https://api.au-syd.speech-to-text.watson.cloud.ibm.com/instances/93b0774b-3417-4097-a169-0196d324c2e9')

@app.route("/speech-to-text", methods=["POST"])
def convert_speech_to_text():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400
    
    audio_file = request.files["audio"]
    
    speech_recognition_results = speech_to_text.recognize(
        audio=audio_file,
        content_type="audio/wav",
        word_alternatives_threshold=0.9
    ).get_result()
    
    return jsonify(speech_recognition_results)

authenticator = IAMAuthenticator('QJM2EY7bhf2M15MloYBDhyny3TcWJRkNJ_xfM0MuxhVV')
text_to_speech = TextToSpeechV1(
    authenticator=authenticator
)

text_to_speech.set_service_url('https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/218d8ce1-fd5f-4a54-b1f6-8ab82922458b')

@app.route("/pronounce", methods=["POST"])
def get_pronounciation():
    data = request.get_json()
    if "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text_input = str(data.get("text", ""))  
    response = text_to_speech.get_pronunciation(
        text=text_input,
        voice='en-US_AllisonV3Voice',
        format='ibm'
    ).get_result()

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
