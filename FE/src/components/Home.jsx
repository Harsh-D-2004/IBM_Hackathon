import React, { useState, useRef } from "react";
import "../index.css";
import {
  Button,
  Card,
  CardMedia,
  Typography,
  CircularProgress,
  Container,
  Grid2,
  Box,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/system";

const Home = () => {
  const [activeTab, setActiveTab] = useState("handwriting");
  const [predictedText, setPredictedText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [pronunciationData, setPronunciationData] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const audioInputRef = useRef(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = React.useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = React.useState(false);
  const [isLoadingPronunciation, setIsLoadingPronunciation] =
    React.useState(false);

  const handleImageUpload = async (event) => {
    console.log("handleImageUpload started");
    setImagePreview(null);
    setPredictedText("");
    setAudioUrl(null);
    setPronunciationData(null);
    setIsLoadingImage(true);

    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected");
      setIsLoadingImage(false);
      return;
    }

    console.log("File uploaded:", file);

    setImagePreview(URL.createObjectURL(file));

    console.log("Image preview created");

    const formData = new FormData();
    formData.append("image", file);

    try {
      //   console.log("Sending image to server...");
      //   const response = await fetch("http://localhost:5000/predict", {
      //     method: "POST",
      //     body: formData,
      //   });
      //   console.log("Response Received");

      //   if (!response.ok) {
      //     const errorData = await response.json();
      //     console.error("HTTP error during prediction:", errorData);
      //     throw new Error(
      //       `HTTP error! status: ${response.status} - ${JSON.stringify(
      //         errorData
      //       )}`
      //     );
      //   }

      //   const data = await response.json();
      //   console.log("Prediction result:", data);
      // setPredictedText(data.predicted_class || "");
      setPredictedText("N" || "");
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Failed to get prediction, please see console for more details");
    } finally {
      setIsLoadingImage(false);
      console.log("handleImageUpload completed");
    }
  };
  const handleGetPronunciation = async (predictedChar) => {
    setIsLoadingPronunciation(true);
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
      setIsLoadingPronunciation(false);
      console.log("handleGetPronunciation completed");
    }
  };

  const handleGetVoice = async (predictedChar) => {
    setIsLoadingVoice(true);
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
      setIsLoadingVoice(false);
      console.log("handleGetVoice completed");
    }
  };

  const playAudio = async () => {
    if (!audioUrl) {
      console.error("Audio URL not set");
      return;
    }

    let fullAudioUrl = audioUrl;
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
    setUploadingAudio(true);
    if (!audioFile) {
      console.log("No audio file selected");
      alert("Please select an audio file.");
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
      setTranscribedText(highestConfidenceWord);
    } catch (error) {
      console.error("Error during transcription:", error);
      alert("Failed to transcribe audio, please see console for more details");
    } finally {
      setUploadingAudio(false);
      console.log("handleSendVoice completed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#FFF8E1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          width: "100%",
          background: "#E65100",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontFamily: "'OpenDyslexic', sans-serif",
            color: "#FFFFFF",
          }}
        >
          DYSLEXILEARN
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "800px",
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          padding: "24px",
          margin: "16px",
        }}
      >
        <Box
          sx={{
            fontFamily: "'OpenDyslexic', sans-serif",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <Button
            variant={activeTab === "handwriting" ? "contained" : "outlined"}
            sx={{
              background:
                activeTab === "handwriting" ? "#FFA726" : "transparent",
              color: "#000000",
              border:
                activeTab === "handwriting" ? "none" : "1px solid #FFA726",
              "&:hover": {
                background: "#FB8C00",
              },
              fontFamily: "'OpenDyslexic', sans-serif",
            }}
            onClick={() => setActiveTab("handwriting")}
          >
            Handwriting Analysis
          </Button>
          <Button
            variant={activeTab === "voice" ? "contained" : "outlined"}
            sx={{
              background: activeTab === "voice" ? "#FFA726" : "transparent",
              color: "#000000",
              border: activeTab === "voice" ? "none" : "1px solid #FFA726",
              "&:hover": {
                background: "#FB8C00",
              },
              fontFamily: "'OpenDyslexic', sans-serif",
            }}
            onClick={() => setActiveTab("voice")}
          >
            Voice Synthesis
          </Button>
        </Box>

        {activeTab === "handwriting" && (
          <Grid2 container spacing={4}>
            {/* Image Upload and Preview */}
            <Grid2 item xs={6}>
              {imagePreview && (
                <CardMedia
                  component="img"
                  image={imagePreview}
                  alt="Uploaded"
                  sx={{
                    borderRadius: "8px",
                    objectFit: "contain",
                    width: "100%",
                    maxHeight: "200px",
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                hidden
              />
              <Button
                variant="contained"
                sx={{
                  background: "#FFA726",
                  color: "#000000",
                  "&:hover": {
                    background: "#FB8C00",
                  },
                  marginTop: "16px",
                  fontFamily: "'OpenDyslexic', sans-serif",
                }}
                onClick={() => fileInputRef.current.click()}
                disabled={isLoadingImage}
              >
                {isLoadingImage ? (
                  <CircularProgress size={24} />
                ) : (
                  "Upload Image"
                )}
              </Button>
            </Grid2>

            {/* Predicted Text and Results */}
            <Grid2 item xs={6}>
              {predictedText && (
                <Box
                  sx={{
                    background: "#F5F5F5",
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "center",
                    fontFamily: "'OpenDyslexic', sans-serif",
                  }}
                >
                  <Card
                    sx={{
                      padding: "24px",
                      background:
                        "linear-gradient(135deg, #FFF5E1 30%, #FFDAB9 100%)",
                      borderRadius: "16px",
                      boxShadow: "0px 6px 12px rgba(0,0,0,0.15)",
                      borderLeft: "8px solid #FF8C42",
                      maxWidth: "600px",
                      margin: "20px auto",
                      fontFamily: "'OpenDyslexic', sans-serif",
                      textAlign: "center",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          color: "#000000",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          fontFamily: "'OpenDyslexic', sans-serif"
                        }}
                      >
                        Predicted Text
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#333333",
                          fontSize: "1.2rem",
                          fontStyle: "italic",
                          padding: "12px",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          boxShadow: "inset 0px 4px 8px rgba(0,0,0,0.1)",
                          fontFamily: "'OpenDyslexic', sans-serif"
                        }}
                      >
                        {predictedText}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Get Voice and Get Pronunciation Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      marginTop: "16px",
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{
                        background: "#FFA726",
                        color: "#000000",
                        "&:hover": {
                          background: "#FB8C00",
                        },
                        fontFamily: "'OpenDyslexic', sans-serif",
                      }}
                      onClick={() => handleGetVoice(predictedText)}
                      disabled={isLoadingVoice}
                    >
                      {isLoadingVoice ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Get Voice"
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      sx={{
                        background: "#FFA726",
                        color: "#000000",
                        "&:hover": {
                          background: "#FB8C00",
                        },
                        fontFamily: "'OpenDyslexic', sans-serif",
                      }}
                      onClick={() => handleGetPronunciation(predictedText)}
                      disabled={isLoadingPronunciation}
                    >
                      {isLoadingPronunciation ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Get Pronunciation"
                      )}
                    </Button>
                  </Box>

                  {/* Results for Get Voice */}
                  {audioUrl && (
                    <Box sx={{ marginTop: "16px" }}>
                      <Button
                        variant="contained"
                        sx={{
                          background: "#4CAF50",
                          color: "#000000",
                          "&:hover": {
                            background: "#388E3C",
                          },
                          fontFamily: "'OpenDyslexic', sans-serif",
                        }}
                        onClick={playAudio}
                      >
                        Play Audio
                      </Button>
                    </Box>
                  )}

                  {/* Results for Get Pronunciation */}
                  {pronunciationData && (
                    <Box sx={{ marginTop: "16px" }}>
                      <Box
                        sx={{
                          background: "#FFFFFF",
                          borderRadius: "8px",
                          border: "2px solid #FFA726",
                          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                          padding: "16px",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "'OpenDyslexic', sans-serif",
                            color: "#000000",
                            fontWeight: 700,
                          }}
                        >
                          Pronunciation
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "'OpenDyslexic', sans-serif",
                            fontSize: "1.2rem",
                            color: "#000000",
                            marginTop: "8px",
                          }}
                        >
                          {pronunciationData}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Grid2>
          </Grid2>
        )}

        {activeTab === "voice" && (
          <Grid2 container spacing={4}>
            <Grid2 item xs={6}>
              <Typography
                variant="h6"
                sx={{
                  color: "#000000",
                  textAlign: "center",
                  fontFamily: "'OpenDyslexic', sans-serif",
                }}
              >
                Upload your recorded voice file
              </Typography>
              {audioPreviewUrl && (
                <audio
                  src={audioPreviewUrl}
                  controls
                  style={{ marginTop: "16px", width: "100%" }}
                />
              )}
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                ref={audioInputRef}
                hidden
              />
              <Button
                variant="contained"
                sx={{
                  background: "#FFA726",
                  color: "#000000",
                  "&:hover": {
                    background: "#FB8C00",
                  },
                  marginTop: "16px",
                  fontFamily: "'OpenDyslexic', sans-serif",
                }}
                onClick={() => audioInputRef.current.click()}
                disabled={isLoadingImage}
              >
                {isLoadingImage ? (
                  <CircularProgress size={24} />
                ) : (
                  "Upload Recording"
                )}
              </Button>

              {/* Send Voice Button */}
              <Button
                variant="contained"
                sx={{
                  background: "#FFA726",
                  color: "#000000",
                  "&:hover": {
                    background: "#FB8C00",
                  },
                  marginTop: "16px",
                  marginLeft: "16px",
                  fontFamily: "'OpenDyslexic', sans-serif",
                }}
                onClick={handleSendVoice}
                disabled={uploadingAudio}
              >
                {uploadingAudio ? <CircularProgress size={24} /> : "Send Voice"}
              </Button>
            </Grid2>
            <Grid2 item xs={6}>
              <Box
                sx={{
                  background: "#F5F5F5",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                  fontFamily: "'OpenDyslexic', sans-serif",
                }}
              >
                {/* Transcription Result */}
                {transcribedText && (
                  <Card
                    sx={{
                      padding: "20px",
                      backgroundColor: "#FFF5E1",
                      borderRadius: "16px",
                      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                      borderLeft: "8px solid #FF8C42",
                      maxWidth: "600px",
                      margin: "auto",
                      fontFamily: "'OpenDyslexic', sans-serif",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#000",
                          fontWeight: "bold",
                          marginBottom: "8px",
                          fontFamily: "'OpenDyslexic', sans-serif",
                        }}
                      >
                        Transcription
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#333",
                          fontSize: "1.1rem",
                          lineHeight: "1.6",
                        }}
                      >
                        {transcribedText}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Grid2>
          </Grid2>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: "100%",
          background: "#E65100", // Dark orange
          padding: "16px",
          textAlign: "center",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontFamily: "'OpenDyslexic', sans-serif",
            color: "#FFFFFF", // White text
          }}
        >
          Terms and Conditions:
          <br />
          This project is for educational purposes only. Rights Reserved with
          the developers of this project
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
