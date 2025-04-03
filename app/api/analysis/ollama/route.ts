import { NextResponse } from 'next/server';
import { 
  fetchOllamaModels, 
  testOllamaConnection,
  analyzeImageWithOllama
} from '@/lib/ollama/ollamaService';

// Handle GET requests to fetch available models
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || '';
    const action = url.searchParams.get('action') || 'list-models';
    
    console.log(`Ollama API route called with baseUrl: ${baseUrl}, action: ${action}`);
    
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: 'No Ollama base URL provided' },
        { status: 400 }
      );
    }

    // Validate URL format before attempting connection
    let normalizedUrl: string;
    try {
      // Ensure URL has protocol
      normalizedUrl = baseUrl;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `http://${normalizedUrl}`;
      }
      
      // Validate URL format
      new URL(normalizedUrl);
      console.log(`Normalized Ollama URL: ${normalizedUrl}`);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Test connection or list models
      if (action === 'test-connection') {
        const isConnected = await testOllamaConnection(normalizedUrl);
        clearTimeout(timeoutId);
        
        console.log(`Connection test to ${normalizedUrl} result: ${isConnected}`);
        
        return NextResponse.json({ 
          success: isConnected, 
          message: isConnected ? 'Connection successful' : 'Failed to connect to Ollama server' 
        });
      } else {
        // List models
        console.log(`Attempting to fetch models from ${normalizedUrl}`);
        const models = await fetchOllamaModels(normalizedUrl);
        clearTimeout(timeoutId);
        
        console.log(`Successfully fetched ${models.length} models from ${normalizedUrl}`);
        
        return NextResponse.json({ 
          success: true, 
          models 
        });
      }
    } catch (innerError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      console.error('Inner error when connecting to Ollama:', innerError);
      
      if (innerError instanceof Error) {
        if (innerError.name === 'AbortError') {
          return NextResponse.json(
            { success: false, error: 'Connection timed out. Make sure the Ollama server is running and accessible.' },
            { status: 504 }
          );
        }
        
        const errorMessage = innerError.message;
        
        if (errorMessage.includes('ECONNREFUSED')) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Connection refused to ${normalizedUrl}. Make sure the Ollama server is running, listening on the specified port, and accepting remote connections (OLLAMA_HOST=0.0.0.0).` 
            },
            { status: 502 }
          );
        }
        
        if (errorMessage.includes('CORS')) {
          return NextResponse.json(
            { success: false, error: 'CORS error. The Ollama server must allow cross-origin requests.' },
            { status: 403 }
          );
        }
      }
      
      // General error response
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to connect to Ollama server: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`,
          details: innerError instanceof Error ? innerError.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Ollama API route:', error);
    
    let errorMessage = 'Failed to process Ollama request';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Customize error message based on error type
      if (error.message.includes('fetch')) {
        errorMessage = `Network error when connecting to Ollama server. Check the URL and ensure the server is running with OLLAMA_HOST=0.0.0.0 to accept remote connections.`;
        statusCode = 502;
      } else if (error.message.includes('Invalid URL')) {
        errorMessage = 'Invalid Ollama server URL format';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: statusCode }
    );
  }
}

// Handle POST requests to analyze images
export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('image') as File;
    const modelName = data.get('modelName') as string;
    const baseUrl = data.get('baseUrl') as string;
    const systemPrompt = data.get('systemPrompt') as string;
    const maxTokens = parseInt(data.get('maxTokens') as string) || undefined;

    if (!file) {
      throw new Error('No image file provided');
    }

    if (!baseUrl) {
      throw new Error('No Ollama base URL provided');
    }

    if (!modelName) {
      throw new Error('No model name provided');
    }

    // Convert image to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Analyze the image with Ollama
    const result = await analyzeImageWithOllama(
      base64Image,
      modelName,
      baseUrl,
      systemPrompt,
      maxTokens
    );

    // Return the analysis result
    return NextResponse.json({
      success: true,
      model: result.model,
      responseText: result.responseText,
      usage: result.usage
    });
  } catch (error) {
    console.error('Error processing Ollama request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process image with Ollama', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
