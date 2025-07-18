interface VisionApiTextAnnotation {
  description: string;
  boundingPoly: {
    vertices: Array<{
      x?: number;
      y?: number;
    }>;
  };
}

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: VisionApiTextAnnotation[];
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

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

// Configuration - You'll need to set this up
const GOOGLE_CLOUD_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

// Convert pixel coordinates to screen coordinates
export const convertToScreenCoordinates = (
  vertices: Array<{x?: number; y?: number}>,
  screenWidth: number,
  screenHeight: number
) => {
  console.log('🔄 Converting pixel coordinates to screen coordinates');
  console.log('📏 Screen dimensions:', { screenWidth, screenHeight });
  console.log('📍 Pixel vertices:', vertices);

  if (vertices.length < 4) {
    console.warn('⚠️ Insufficient vertices for bounding box:', vertices.length);
    return null;
  }

  // Get bounding box from vertices (these are already in pixel coordinates)
  const minX = Math.min(...vertices.map(v => v.x || 0));
  const maxX = Math.max(...vertices.map(v => v.x || 0));
  const minY = Math.min(...vertices.map(v => v.y || 0));
  const maxY = Math.max(...vertices.map(v => v.y || 0));

  const boundingBox = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };

  console.log('📦 Calculated bounding box:', boundingBox);
  return boundingBox;
};

// Call Google Cloud Vision API for text detection (OCR)
export const detectText = async (
  base64Image: string,
  screenWidth: number,
  screenHeight: number
): Promise<ExtractedText> => {
  console.log('🚀 Starting Google Cloud Vision API text detection (OCR)');
  console.log('📊 Image data length:', base64Image.length, 'characters');
  console.log('📏 Target screen dimensions:', { screenWidth, screenHeight });

  if (!GOOGLE_CLOUD_API_KEY) {
    const errorMsg = 'Google Cloud API key not configured. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your environment.';
    console.error('🔑 API Key Error:', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('🔑 API key found, length:', GOOGLE_CLOUD_API_KEY.length, 'characters');

  const requestBody = {
    requests: [{
      image: {
        content: base64Image
      },
      features: [{
        type: "TEXT_DETECTION",
        maxResults: 100
      }]
    }]
  };

  console.log('📤 Preparing API request with features:', requestBody.requests[0].features);

  const apiUrl = VISION_API_ENDPOINT + `?key=${GOOGLE_CLOUD_API_KEY.substring(0, 8)}...`;
  console.log('🌐 API endpoint:', apiUrl);

  try {
    console.log('📡 Sending request to Google Cloud Vision API...');
    const startTime = Date.now();

    const response = await fetch(VISION_API_ENDPOINT + `?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const requestDuration = Date.now() - startTime;
    console.log('⏱️ API request completed in', requestDuration, 'ms');
    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:');
      console.error('   Status:', response.status);
      console.error('   Status Text:', response.statusText);
      console.error('   Error Response:', errorText);
      throw new Error(`Vision API request failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ API request successful, parsing response...');
    const result: VisionApiResponse = await response.json();

    console.log('📄 Full API response structure:', {
      hasTextAnnotations: !!result.responses[0]?.textAnnotations,
      textAnnotationsCount: result.responses[0]?.textAnnotations?.length || 0,
      hasFullTextAnnotation: !!result.responses[0]?.fullTextAnnotation,
      hasError: !!result.responses[0]?.error
    });

    if (result.responses[0]?.error) {
      console.error('❌ Vision API returned error:');
      console.error('   Code:', result.responses[0].error.code);
      console.error('   Message:', result.responses[0].error.message);
      throw new Error(`Vision API error: ${result.responses[0].error.message}`);
    }

    const textAnnotations = result.responses[0]?.textAnnotations || [];
    const fullTextAnnotation = result.responses[0]?.fullTextAnnotation;

    console.log('📝 Found', textAnnotations.length, 'text annotations');
    console.log('📄 Full text available:', !!fullTextAnnotation);

    // Get the full text (first annotation contains the complete text)
    const fullText = fullTextAnnotation?.text || textAnnotations[0]?.description || '';
    console.log('📖 Extracted full text length:', fullText.length, 'characters');

    // Process individual words (skip the first annotation as it's the full text)
    const wordAnnotations = textAnnotations.slice(1);
    console.log('🔤 Processing', wordAnnotations.length, 'individual word annotations');

    const words = wordAnnotations.map((annotation, index) => {
      console.log(`🔄 Processing word ${index + 1}: "${annotation.description}"`);

      const coords = convertToScreenCoordinates(
        annotation.boundingPoly.vertices,
        screenWidth,
        screenHeight
      );

      const word = {
        id: `word-${index}`,
        text: annotation.description,
        confidence: 0.9, // Vision API doesn't provide confidence for text detection
        x: coords?.x || 0,
        y: coords?.y || 0,
        width: coords?.width || 0,
        height: coords?.height || 0
      };

      console.log(`✅ Created word object:`, word);
      return word;
    });

    const extractedText: ExtractedText = {
      fullText,
      words
    };

    console.log('🎉 Successfully processed text extraction');
    console.log('📊 Results summary:', {
      fullTextLength: fullText.length,
      wordCount: words.length
    });

    return extractedText;
  } catch (error) {
    console.error('💥 Vision API error occurred:');

    if (error instanceof Error) {
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    } else {
      console.error('   Unknown error:', error);
    }

    throw error;
  }
};

// Demo data for testing without API
export const getDemoText = (screenWidth: number, screenHeight: number): ExtractedText => {
  console.log('🎭 Generating demo text for testing');
  console.log('📏 Using screen dimensions:', { screenWidth, screenHeight });

  const demoText = `Welcome to OCR Demo!

This is a sample text that would be extracted from an image using Google Cloud Vision API.

Some example text might include:
• Business cards
• Street signs
• Documents
• Handwritten notes
• Book pages

The text detection feature can recognize text in many languages and formats.`;

  const demoWords = [
    {
      id: "word-1",
      text: "Welcome",
      confidence: 0.95,
      x: screenWidth * 0.1,
      y: screenHeight * 0.2,
      width: screenWidth * 0.2,
      height: screenHeight * 0.05
    },
    {
      id: "word-2",
      text: "OCR",
      confidence: 0.92,
      x: screenWidth * 0.35,
      y: screenHeight * 0.2,
      width: screenWidth * 0.1,
      height: screenHeight * 0.05
    },
    {
      id: "word-3",
      text: "Demo!",
      confidence: 0.88,
      x: screenWidth * 0.5,
      y: screenHeight * 0.2,
      width: screenWidth * 0.15,
      height: screenHeight * 0.05
    }
  ];

  const extractedText: ExtractedText = {
    fullText: demoText,
    words: demoWords
  };

  console.log('🎭 Generated demo text:', {
    textLength: demoText.length,
    wordCount: demoWords.length
  });

  return extractedText;
};
