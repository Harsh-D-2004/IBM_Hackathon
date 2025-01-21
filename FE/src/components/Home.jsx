import React, { useState, useRef } from "react";
import "../index.css";

const Home = () => {
  const [activeTab, setActiveTab] = useState("handwriting");
  const [predictedText, setPredictedText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [pronunciationData, setPronunciationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const audioInputRef = useRef(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);

  const handleImageUpload = async (event) => {
    console.log("handleImageUpload started");
    setIsLoading(true);
    setImagePreview(null);
    setPredictedText("");
    setAudioUrl(null);
    setPronunciationData(null);

    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected");
      setIsLoading(false);
      return;
    }

    console.log("File uploaded:", file);

    setImagePreview(URL.createObjectURL(file));

    console.log("Image preview created");

    const formData = new FormData();
    formData.append("image", file);

    try {
      console.log("Sending image to server...");
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      console.log("Response Received");

      if (!response.ok) {
        const errorData = await response.json();
        console.error("HTTP error during prediction:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      console.log("Prediction result:", data);
      setPredictedText(data.predicted_class || '');
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Failed to get prediction, please see console for more details");
    } finally {
      setIsLoading(false);
      console.log("handleImageUpload completed");
    }
  };
  const handleGetPronunciation = async (predictedChar) => {
    setIsLoading(true);
    try {
      console.log("Starting handleGetPronunciation");
      const response = await fetch("http://localhost:5000/pronounce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: predictedChar,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching pronunciation:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      console.log("pronunciation result", data);
      setPronunciationData(data.pronunciation);
    } catch (error) {
      console.error("Error getting pronunciation", error);
      alert(
        "Failed to fetch pronunciation, please see console for more details"
      );
    } finally {
      setIsLoading(false);
      console.log("handleGetPronunciation completed");
    }
  };

  const handleGetVoice = async (predictedChar) => {
    setIsLoading(true);
    try {
      console.log("Starting handleGetVoice");
      const response = await fetch("http://localhost:5000/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: predictedChar,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching voice:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("Voice generated:", audioUrl);
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch audio, please see console for more details");
      setAudioUrl(null);
    } finally {
      setIsLoading(false);
      console.log("handleGetVoice completed");
    }
  };

  const playAudio = async () => {
  if (!audioUrl) {
    console.error("Audio URL not set");
    return;
  }

  let fullAudioUrl = audioUrl;

  // Check if audioUrl is relative, then add the base URL
  if (!audioUrl.startsWith("http") && !audioUrl.startsWith("blob:")) {
    fullAudioUrl = `http://localhost:5000${audioUrl}`;
  }

  console.log("Full Audio URL:", fullAudioUrl);

  try {
    const audio = new Audio(fullAudioUrl);
    await audio.play();
  } catch (error) {
    console.error("Error playing audio:", error);
    alert("Failed to load audio. Please check the file format or URL.");
  }
};

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    console.log("Audio file selected", file);
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };
  const handleSendVoice = async () => {
    console.log("Starting handleSendVoice");
    setIsLoading(true);
    setUploadingAudio(true);
    if (!audioFile) {
      console.log("No audio file selected");
      alert("Please select an audio file.");
      setIsLoading(false);
      setUploadingAudio(false);
      return;
    }

    console.log("Audio file to be sent:", audioFile);

    const formData = new FormData();
    formData.append("audio", audioFile, "recording.wav");
    console.log("Form data created", formData);

    try {
      console.log("Sending audio file to server");
      const response = await fetch("http://localhost:5000/speech-to-text", {
        method: "POST",
        body: formData,
      });
      console.log("Response received from server");

      if (!response.ok) {
        const errorData = await response.json();
        console.error("HTTP error during speech to text:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }
      const data = await response.json();
      const wordAlternatives = data.results[0].word_alternatives;
      let highestConfidenceWord = "";
      let highestConfidence = 0;

      wordAlternatives.forEach((item) => {
        item.alternatives.forEach((alt) => {
          if (alt.confidence > highestConfidence) {
            highestConfidence = alt.confidence;
            highestConfidenceWord = alt.word;
          }
        });
      });

      console.log(
        `Transcript: ${highestConfidenceWord}, Confidence: ${highestConfidence}`
      );
      // console.log("Transcription result:", data);
      setTranscribedText(highestConfidenceWord);
    } catch (error) {
      console.error("Error during transcription:", error);
      alert("Failed to transcribe audio, please see console for more details");
    } finally {
      setIsLoading(false);
      setUploadingAudio(false);
      console.log("handleSendVoice completed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center py-8 px-4 font-sans open-dyslexic-font">
      <div className="absolute top-4 left-4">
        <h1 className="text-6xl font-extrabold text-black open-dyslexic-bold-italic">
          Learning Made Easy
        </h1>
      </div>

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 space-y-8 mt-16">
        <header className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-700 open-dyslexic-bold">
            Choose Your Learning Method
          </h2>
        </header>

        <div className="tabs flex justify-center space-x-8 mb-6">
          <button
            onClick={() => setActiveTab("handwriting")}
            className={`px-6 py-2 text-lg font-medium rounded-t-lg transition-colors ${
              activeTab === "handwriting"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-blue-600"
            }`}
          >
            Handwriting Analysis
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`px-6 py-2 text-lg font-medium rounded-t-lg transition-colors ${
              activeTab === "voice"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-blue-600"
            }`}
          >
            Voice Synthesis
          </button>
        </div>

        {activeTab === "handwriting" && (
          <div className="space-y-6">
            <div className="text-center flex flex-col items-center">
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    style={{ maxWidth: "200px" }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-2 text-lg font-medium rounded-lg bg-purple-600 text-white open-dyslexic-bold"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Upload Image"}
              </button>

              {predictedText && (
                <h3 className="text-2xl font-semibold text-gray-700 mt-4 open-dyslexic-mono">
                  Predicted Text: {predictedText}
                </h3>
              )}
            </div>

            {predictedText && (
              <div className="text-center mt-6">
                <button
                  onClick={() => handleGetVoice(predictedText)}
                  className="px-6 py-2 text-lg font-medium rounded-lg bg-blue-600 text-white open-dyslexic-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Get Voice"}
                </button>
                <button
                  onClick={() => handleGetPronunciation(predictedText)}
                  className="mt-2 px-6 py-2 text-lg font-medium rounded-lg bg-blue-600 text-white open-dyslexic-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Get Pronunciation"}
                </button>
              </div>
            )}

            {audioUrl ? (
              <div className="mt-4 text-center">
                <button
                  className="px-6 py-2 text-lg font-medium rounded-lg bg-green-600 text-white open-dyslexic-bold"
                  onClick={playAudio}
                >
                  Play Audio
                </button>
                {pronunciationData && (
                  <div>
                    <button
                      className="mt-2 px-6 py-2 text-lg font-medium rounded-lg bg-green-600 text-white open-dyslexic-bold"
                      onClick={() => alert(pronunciationData)} // Display the value of setPronunciation
                    >
                      Show Pronunciation
                    </button>
                    {pronunciationData && (
                      <p className="mt-2 text-center text-gray-500">
                        {pronunciationData}{" "}
                        {/* Display the value of setPronunciation */}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-center text-gray-500">
                Audio is not available yet.
              </p>
            )}
          </div>
        )}

        {activeTab === "voice" && (
          <div className="mt-4 flex flex-col items-center">
            <h3 className="text-2xl font-semibold text-gray-700 open-dyslexic-bold">
              Upload your recorded voice file
            </h3>
            {audioPreviewUrl && (
              <audio src={audioPreviewUrl} controls className="mt-2" />
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              ref={audioInputRef}
              style={{ display: "none" }}
            />
            <button
              className="px-6 py-2 text-lg font-medium rounded-lg bg-blue-600 text-white open-dyslexic-bold"
              onClick={() => audioInputRef.current.click()}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Upload Recording"}
            </button>

            <button
              className="mt-4 px-6 py-2 text-lg font-medium rounded-lg bg-blue-600 text-white open-dyslexic-bold"
              onClick={handleSendVoice}
              disabled={isLoading || uploadingAudio}
            >
              {uploadingAudio ? "Uploading..." : "Send Voice"}
            </button>

            {transcribedText && (
              <div className="mt-4 text-center open-dyslexic-mono">
                <h3 className="text-xl font-semibold text-gray-700">
                  Transcription:
                </h3>
                <p>{transcribedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
