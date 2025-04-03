import { AnalysisResult } from '@/types/types';

// Ollama API endpoints
const OLLAMA_LIST_MODELS = '/api/tags';
const OLLAMA_GENERATE = '/api/generate';

/**
 * Validate and normalize an Ollama server URL
 * @param baseUrl The base URL for Ollama API
 * @returns Normalized URL or throws error if invalid
 */
function validateOllamaUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('Ollama server URL is required');
  }
  
  // Add protocol if missing
  let normalizedUrl = baseUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `http://${normalizedUrl}`;
  }
  
  // Ensure URL is valid
  try {
    new URL(normalizedUrl);
  } catch (error) {
    throw new Error('Invalid Ollama server URL format');
  }
  
  // Remove trailing slash if present
  return normalizedUrl.endsWith('/') ? normalizedUrl.slice(0, -1) : normalizedUrl;
}

/**
 * Fetches available models from Ollama
 * @param baseUrl The base URL for Ollama API (e.g., http://localhost:11434)
 * @returns An array of available models
 */
export async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    // Validate and normalize the URL
    const normalizedBaseUrl = validateOllamaUrl(baseUrl);
    
    console.log('Fetching Ollama models from URL:', normalizedBaseUrl);
    
    // Make the API request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${normalizedBaseUrl}${OLLAMA_LIST_MODELS}`, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // The response should have a 'models' array
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => model.name);
      }
      
      return [];
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Connection to ${normalizedBaseUrl} timed out`);
      }
      throw err;
    }
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    throw error;
  }
}

/**
 * Tests the connection to an Ollama server
 * @param baseUrl The base URL for Ollama API
 * @returns A boolean indicating if the connection was successful
 */
export async function testOllamaConnection(baseUrl: string): Promise<boolean> {
  try {
    // Validate and normalize the URL
    const normalizedBaseUrl = validateOllamaUrl(baseUrl);
    
    console.log('Testing Ollama connection to URL:', normalizedBaseUrl);
    
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Simple request to check if the server is responsive
      const response = await fetch(`${normalizedBaseUrl}${OLLAMA_LIST_MODELS}`, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    console.error('Error testing Ollama connection:', error);
    return false;
  }
}

/**
 * Analyzes an image using Ollama
 * @param imageBase64 Base64 encoded image data
 * @param modelName The name of the Ollama model to use
 * @param baseUrl The base URL for Ollama API
 * @param systemPrompt System prompt to guide the model
 * @param maxTokens Maximum number of tokens to generate
 * @returns Analysis result
 */
export async function analyzeImageWithOllama(
  imageBase64: string,
  modelName: string,
  baseUrl: string,
  systemPrompt: string = '',
  maxTokens: number = 1024
): Promise<AnalysisResult> {
  try {
    // Validate and normalize the URL
    const normalizedBaseUrl = validateOllamaUrl(baseUrl);
    
    // Create a prompt that includes the image
    // For models that support vision
    const prompt = `
You are an expert entomologist and taxonomist specialized in identifying insects from images.
Analyze the following image and provide a detailed identification.

${systemPrompt ? systemPrompt + '\n' : ''}
`;

    const response = await fetch(`${normalizedBaseUrl}${OLLAMA_GENERATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        images: [imageBase64.split(',')[1]], // Remove the data:image/* prefix
        stream: false,
        options: {
          num_predict: maxTokens,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to analyze image: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      model: modelName,
      responseText: data.response || '',
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  } catch (error) {
    console.error('Error analyzing image with Ollama:', error);
    throw error;
  }
}
