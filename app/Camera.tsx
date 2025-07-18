import {CameraView, useCameraPermissions} from "expo-camera";
import * as ImageManipulator from 'expo-image-manipulator';
import {useRef, useState} from "react";
import {Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {detectText, getDemoText} from './services/visionApi';

interface ExtractedText {
  fullText: string;
  words: Array<{
    id: string;
    text: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default function Cam() {
  const [permission, requestPermission] = useCameraPermissions();
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image'); // Toggle between image and text view
  const cameraRef = useRef<CameraView>(null);

  console.log('📱 Camera component initialized for OCR');
  console.log('📏 Screen dimensions:', {screenWidth, screenHeight});

  // Close analysis and return to camera
  const closeAnalysis = () => {
    console.log('❌ Closing analysis, returning to camera view');
    setCapturedImageUri(null);
    setExtractedText(null);
    setAnalysisComplete(false);
    setViewMode('image');
    console.log('✅ Analysis state cleared, camera view restored');
  };

  // Call Google Cloud Vision API for OCR or use demo data
  const analyzeImage = async (imageUri: string) => {
    console.log('🔍 Starting OCR text extraction process');
    console.log('🖼️ Image URI:', imageUri);

    setIsAnalyzing(true);
    console.log('🔄 Set analyzing state to true');

    try {
      console.log('🔧 Starting image manipulation...');
      const manipulationStartTime = Date.now();

      // Convert image to base64
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{resize: {width: 800}}], // Resize to reduce API costs
        {compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true}
      );

      const manipulationDuration = Date.now() - manipulationStartTime;
      console.log('✅ Image manipulation completed in', manipulationDuration, 'ms');
      console.log('📊 Manipulated image info:', {
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        uri: manipulatedImage.uri,
        base64Length: manipulatedImage.base64?.length || 0
      });

      if (!manipulatedImage.base64) {
        const error = 'Failed to convert image to base64';
        console.error('❌ Image manipulation error:', error);
        throw new Error(error);
      }

      console.log('✅ Base64 conversion successful, length:', manipulatedImage.base64.length, 'characters');

      try {
        console.log('🚀 Attempting to use Google Cloud Vision API for OCR...');
        // Try to use real Vision API
        const apiStartTime = Date.now();
        const textResult = await detectText(manipulatedImage.base64, screenWidth, screenHeight);
        const apiDuration = Date.now() - apiStartTime;

        console.log('🎉 Vision API OCR call successful!');
        console.log('⏱️ Total API processing time:', apiDuration, 'ms');
        console.log('📋 Extracted text length:', textResult.fullText.length, 'characters');
        console.log('🔤 Found', textResult.words.length, 'words');

        setExtractedText(textResult);
        console.log('✅ Updated extracted text state with real API results');

      } catch (apiError: any) {
        console.log('⚠️ Vision API call failed, falling back to demo data');
        console.log('📝 API Error details:', {
          message: apiError.message,
          type: apiError.constructor.name
        });

        // If API fails (no key, quota exceeded, etc.), show setup instructions and use demo data
        if (apiError.message.includes('not configured')) {
          console.log('🔑 API key not configured, showing setup instructions');
          Alert.alert(
            "Google Cloud Vision API Setup Required",
            "To use real OCR text extraction, follow the setup instructions in VISION_API_SETUP.md\n\nShowing demo text for now...",
            [{text: "OK"}]
          );
        } else {
          console.log('💥 API error occurred, showing error dialog');
          Alert.alert(
            "Vision API Error",
            `${apiError.message}\n\nShowing demo text for now...`,
            [{text: "OK"}]
          );
        }

        console.log('🎭 Generating demo text as fallback...');
        // Use demo data as fallback
        const demoText = getDemoText(screenWidth, screenHeight);
        setExtractedText(demoText);
        console.log('✅ Updated extracted text state with demo data');
      }

    } catch (error) {
      console.error('💥 Critical error in OCR analysis:');
      console.error('   Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      console.error('   Stack trace:', error instanceof Error ? error.stack : 'Not available');

      Alert.alert('Error', 'Failed to process image for OCR. Please try again.');
    } finally {
      console.log('🔄 Setting analyzing state to false and analysis complete to true');
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }
  };

  // Capture photo and analyze
  const captureAndAnalyze = async () => {
    console.log('📸 Capture button pressed for OCR');

    if (!cameraRef.current) {
      console.error('❌ Camera ref is null, cannot capture photo');
      return;
    }

    console.log('✅ Camera ref is available, proceeding with capture');

    try {
      console.log('🔄 Setting analyzing state to true (capture phase)');
      setIsAnalyzing(true);

      console.log('📱 Taking photo with camera...');
      const captureStartTime = Date.now();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      const captureDuration = Date.now() - captureStartTime;
      console.log('📸 Photo capture completed in', captureDuration, 'ms');

      if (photo?.uri) {
        console.log('✅ Photo captured successfully');
        console.log('📊 Photo details:', {
          uri: photo.uri,
          width: photo.width,
          height: photo.height
        });

        // Set the captured image URI to show the static image
        setCapturedImageUri(photo.uri);
        console.log('🖼️ Set captured image URI for display');

        console.log('🔍 Starting OCR analysis of captured photo...');
        await analyzeImage(photo.uri);
        console.log('✅ OCR analysis completed');
      } else {
        console.error('❌ Photo capture failed: no URI returned');
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('💥 Error during photo capture:');
      console.error('   Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      console.error('   Stack trace:', error instanceof Error ? error.stack : 'Not available');

      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsAnalyzing(false);
    } finally {
      console.log('📸 Capture function completed');
    }
  };

  // Log permission state changes
  console.log('🔐 Camera permission state:', {
    granted: permission?.granted,
    canAskAgain: permission?.canAskAgain,
    status: permission?.status
  });

  if (!permission) {
    console.log('⏳ Camera permissions are being requested...');
    return (
      <View style={styles.center}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    console.log('🚫 Camera permission not granted, showing permission request UI');
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          console.log('🔐 User requested camera permission');
          requestPermission();
        }}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('✅ Camera permission granted, rendering camera interface');
  console.log('📝 Current extracted text available:', !!extractedText);
  console.log('🔄 Currently analyzing:', isAnalyzing);
  console.log('🖼️ Captured image URI:', capturedImageUri ? 'Set' : 'None');
  console.log('📊 Analysis complete:', analysisComplete);
  console.log('👁️ Current view mode:', viewMode);

  return (
    <View style={styles.container}>
      {/* Show either live camera, captured image, or text view */}
      {capturedImageUri && analysisComplete ? (
        viewMode === 'image' ? (
          <Image
            source={{uri: capturedImageUri}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          // Text view
          <View style={styles.textContainer}>
            <ScrollView
              style={styles.textScrollView}
              contentContainerStyle={styles.textContentContainer}
            >
              <Text
                style={styles.extractedText}
                selectable={true}
              >
                {extractedText?.fullText || 'No text found in image'}
              </Text>
            </ScrollView>
          </View>
        )
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
      )}

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isAnalyzing ? "🔍 Extracting text..." :
            analysisComplete ? "✅ Text Extracted" :
              "📸 Ready to capture"}
        </Text>
      </View>

      {/* Word detection overlays - only show in image view */}
      {viewMode === 'image' && extractedText?.words.map((word) => {
        console.log('🎯 Rendering word overlay for:', word.text, 'at', {x: word.x, y: word.y, w: word.width, h: word.height});
        return (
          <View
            key={word.id}
            style={[
              styles.detectionBox,
              {
                left: word.x,
                top: word.y,
                width: word.width,
                height: word.height,
              },
            ]}
          >
            <View style={styles.labelContainer}>
              <Text style={styles.wordLabel}>{word.text}</Text>
              <Text style={styles.confidence}>
                {Math.round(word.confidence * 100)}%
              </Text>
            </View>
          </View>
        );
      })}

      {/* Text extraction info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>📝 OCR Text Extraction</Text>
        <Text style={styles.infoText}>
          {extractedText?.fullText
            ? `Extracted ${extractedText.words.length} words (${extractedText.fullText.length} characters)`
            : analysisComplete
              ? "No text detected in this image"
              : "Tap the capture button to extract text"
          }
        </Text>
      </View>

      {/* View toggle buttons - only show when analysis is complete */}
      {analysisComplete && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'image' && styles.toggleButtonActive]}
            onPress={() => {
              console.log('🖼️ Switching to image view');
              setViewMode('image');
            }}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'image' && styles.toggleButtonTextActive]}>
              📷 Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'text' && styles.toggleButtonActive]}
            onPress={() => {
              console.log('📝 Switching to text view');
              setViewMode('text');
            }}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'text' && styles.toggleButtonTextActive]}>
              📝 Text
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        {analysisComplete ? (
          // Show close button when analysis is complete
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('🔄 Close button pressed, returning to camera');
              closeAnalysis();
            }}
          >
            <Text style={styles.closeButtonText}>
              📸 Take Another Photo
            </Text>
          </TouchableOpacity>
        ) : (
          // Show capture button when ready to capture
          <TouchableOpacity
            style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
            onPress={() => {
              console.log('🎯 Capture button touched, isAnalyzing:', isAnalyzing);
              if (!isAnalyzing) {
                captureAndAnalyze();
              } else {
                console.log('⏳ Ignoring capture button press - analysis in progress');
              }
            }}
            disabled={isAnalyzing}
          >
            <Text style={styles.captureButtonText}>
              {isAnalyzing ? "Extracting..." : "Capture & Extract Text"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          💡 See VISION_API_SETUP.md for Google Cloud Vision API setup
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E7F3FF',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  detectionBox: {
    position: "absolute",
    zIndex: 5,
    borderWidth: 2,
    borderColor: "#00C851",
    backgroundColor: "transparent",
  },
  labelContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: "absolute",
    top: -35,
    left: 0,
  },
  wordLabel: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  confidence: {
    color: "#00C851",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 1,
  },
  infoPanel: {
    position: "absolute",
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 15,
    maxHeight: 120,
    zIndex: 10,
  },
  infoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  actionContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },
  captureButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonDisabled: {
    backgroundColor: "#666",
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },
  instructionsText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black', // Ensure text is visible on dark background
  },
  textScrollView: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  textContentContainer: {
    alignItems: 'center',
  },
  extractedText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  toggleContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    zIndex: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "white",
  },
  toggleButtonActive: {
    backgroundColor: "white",
    borderColor: "white",
  },
  toggleButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  toggleButtonTextActive: {
    color: "#007AFF",
  },
});
