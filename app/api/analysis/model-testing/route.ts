import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('image') as File;

    if (!file) {
      throw new Error('No image file provided');
    }

    // Convert image to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Prepare the prompt for initial detection (bounding boxes and higher taxonomy)
    const initialPrompt = `Detect all insects or animals in the image, with no more than 20 items. For each detection:
1. Provide a 2D bounding box
2. Identify the Family and Genus (not species level)
3. List top 5 possible species candidates within that Genus

Output a JSON list where each entry contains:
- "box_2d": normalized coordinates between 0 and 1000
- "family": taxonomic family name
- "genus": taxonomic genus name
- "possible_species": array of 5 most likely species names within this genus

Be as accurate as possible with the taxonomy classification.`;

    // Call Gemini API for initial detection
    const initialResult = await model.generateContent([
      { text: initialPrompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const initialResponse = await initialResult.response;
    const initialText = initialResponse.text();
    
    // Extract and parse the initial JSON response
    const jsonMatch = initialText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', initialText);
      throw new Error('Invalid response format: no JSON array found');
    }
    
    const initialData = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(initialData)) {
      throw new Error('Invalid response format: expected array');
    }

    // Process each detection with a second, more focused analysis
    const finalResults = await Promise.all(initialData.map(async (detection: any) => {
      // Prepare cropped image data (in real implementation, you'd need to crop the image)
      // For now, we'll use the full image but focus the prompt on the specific region

      const refinementPrompt = `Focus on the insect/animal in this specific region:
Bounding box: ${JSON.stringify(detection.box_2d)}
Family: ${detection.family}
Genus: ${detection.genus}
Possible species: ${JSON.stringify(detection.possible_species)}

Using the image and this context, perform a detailed analysis:
1. Carefully examine the visual characteristics
2. Compare with the candidate species
3. Explain your reasoning for the final species selection

Output a JSON object with:
- "final_species": the most accurate species identification
- "confidence": confidence level (0-1)
- "reasoning": brief explanation of the selection`;

      const refinementResult = await model.generateContent([
        { text: refinementPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        }
      ]);

      const refinementResponse = await refinementResult.response;
      const refinementText = refinementResponse.text();

      // Extract the refined species identification
      const refinementJson = JSON.parse(refinementText.match(/\{[\s\S]*\}/)?.[0] || '{}');

      return {
        box_2d: {
          x1: Math.min(detection.box_2d[1], detection.box_2d[3]) / 1000,
          y1: Math.min(detection.box_2d[0], detection.box_2d[2]) / 1000,
          x2: Math.max(detection.box_2d[1], detection.box_2d[3]) / 1000,
          y2: Math.max(detection.box_2d[0], detection.box_2d[2]) / 1000
        },
        taxonomy: {
          family: detection.family,
          genus: detection.genus,
          species: refinementJson.final_species,
          confidence: refinementJson.confidence,
          reasoning: refinementJson.reasoning
        },
        possible_species: detection.possible_species
      };
    }));

    const response = {
      detections: finalResults,
      debug: {
        initialResponse: initialText,
        initialData,
        finalResults
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
