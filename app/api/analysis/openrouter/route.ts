import { NextResponse } from 'next/server';
import { 
  fetchAvailableModels, 
  analyzeImage
} from '@/lib/openrouter/openRouterService';

// Handle GET requests to fetch available models
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('apiKey') || undefined;
    
    const models = await fetchAvailableModels(apiKey);
    
    return NextResponse.json({ 
      success: true, 
      models 
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch models', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle POST requests to analyze images
export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('image') as File;
    const modelId = data.get('modelId') as string;
    const apiKey = data.get('apiKey') as string;
    const systemPrompt = data.get('systemPrompt') as string;
    const maxTokens = parseInt(data.get('maxTokens') as string) || undefined;
    const temperature = parseFloat(data.get('temperature') as string) || undefined;
    const mode = data.get('mode') as string;
    const selectedModels = data.get('selectedModels') ? 
      JSON.parse(data.get('selectedModels') as string) : 
      undefined;
    const knownSpecies = data.get('knownSpecies') as string;

    if (!file) {
      throw new Error('No image file provided');
    }

    // Log API key status (but not the actual key for security)
    console.log('API key provided:', apiKey ? 'Yes' : 'No');
    if (!apiKey) {
      console.warn('No API key provided - vision models may not work without an API key');
    }

    // Convert image to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Check mode and route request accordingly
    if (mode === 'battle' && selectedModels && Array.isArray(selectedModels) && selectedModels.length >= 2) {
      // Battle mode - compare two models side by side
      console.log(`Running battle mode with models: ${selectedModels[0]} vs ${selectedModels[1]}`);
      
      // Run analyses for both models
      const leftModel = selectedModels[0];
      const rightModel = selectedModels[1];
      
      // Run both analyses in parallel
      const [leftResult, rightResult] = await Promise.all([
        analyzeImage(
          base64Image,
          leftModel,
          apiKey,
          systemPrompt,
          maxTokens,
          temperature
        ),
        analyzeImage(
          base64Image,
          rightModel,
          apiKey,
          systemPrompt,
          maxTokens,
          temperature
        )
      ]);
      
      return NextResponse.json({
        success: true,
        mode: 'battle',
        leftModel: leftModel,
        leftResult: leftResult,
        rightModel: rightModel,
        rightResult: rightResult
      });
    } else {
      // Free mode - single model analysis
      if (!modelId) {
        throw new Error('No model ID provided');
      }
      
      const result = await analyzeImage(
        base64Image,
        modelId,
        apiKey,
        systemPrompt,
        maxTokens,
        temperature
      );
      
      // No longer need to extract detections since we're using text-only response
      console.log(`API Route: Received response from model ${result.model}`);
      
      return NextResponse.json({
        success: true,
        model: result.model,
        responseText: result.responseText,
        usage: result.raw?.usage
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process image', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
