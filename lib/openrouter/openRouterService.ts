import { OpenRouterModel, AnalysisMode } from '@/types/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// Species detection interface for type safety
interface Detection {
  taxonomy: {
    species?: string;
    Species?: string;
    family?: string;
    genus?: string;
    class?: string;
    order?: string;
    phylum?: string;
    kingdom?: string;
    details?: string;
    [key: string]: any;
  };
  possible_species?: string[];
  confidence?: number;
  text_analysis?: string;
  common_name?: string;
  [key: string]: any;
}

/**
 * Fetches available models from OpenRouter API
 * @param apiKey Optional API key for accessing paid models
 * @returns List of available models that support image analysis
 */
export async function fetchAvailableModels(apiKey?: string): Promise<OpenRouterModel[]> {
  try {
    // Headers for OpenRouter API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (apiKey) {
      // Make sure the API key has the correct prefix
      const formattedKey = apiKey.startsWith('sk-or-') ? apiKey : `sk-or-${apiKey}`;
      headers['Authorization'] = `Bearer ${formattedKey}`;
      console.log('Using provided API key:', formattedKey.substring(0, 10) + '...');
    } else {
      console.log('No API key provided, using environment variable if available');
      // Try to use environment variable as fallback
      const envApiKey = process.env.OPENROUTER_API_KEY;
      if (envApiKey) {
        const formattedEnvKey = envApiKey.startsWith('sk-or-') ? envApiKey : `sk-or-${envApiKey}`;
        headers['Authorization'] = `Bearer ${formattedEnvKey}`;
        console.log('Using environment API key');
      } else {
        console.warn('No API key available - request will likely fail for vision models');
      }
    }

    // Add referrer info for OpenRouter leaderboards
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://pestiid-dashboard.app';
    headers['X-Title'] = 'PestID Dashboard';

    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      // Get more detailed error information
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
        console.error('OpenRouter API error:', errorDetails);
      } catch (e) {
        // If can't parse JSON, just use status text
        console.error('OpenRouter API error status:', response.status, response.statusText);
      }
      
      throw new Error(`Error fetching models: ${response.statusText || 'Request failed'} - ${errorDetails || `Status: ${response.status}`}`);
    }

    const data = await response.json();
    
    // Filter models for those that support image analysis (vision capabilities)
    const visionModels = data.data.filter((model: { 
      id: string, 
      name: string, 
      provider: string, 
      description?: string, 
      capabilities?: string[],
      multimodal?: boolean,
      pricing?: { prompt?: number, completion?: number },
      context_length?: number
    }) => {
      // More inclusive check for vision capabilities
      return (
        model.capabilities?.includes('vision') || 
        model.multimodal === true ||
        model.capabilities?.includes('multimodal') ||
        // Include models that might support images based on name heuristics
        model.name.toLowerCase().includes('vision') ||
        model.name.toLowerCase().includes('visual') ||
        model.name.toLowerCase().includes('image') ||
        model.name.toLowerCase().includes('clip') ||
        model.name.toLowerCase().includes('claude') || // Claude models typically support images
        model.name.toLowerCase().includes('gpt-4') ||  // GPT-4 models typically support images
        model.name.toLowerCase().includes('gemini')    // Gemini models typically support images
      );
    });

    console.log('Available models:', JSON.stringify(data.data.map((m: any) => m.id)));
    console.log('Filtered vision models:', JSON.stringify(visionModels.map((m: any) => m.id)));

    // Add more detailed logging for vision model pricing
    console.log('Vision models pricing:', JSON.stringify(visionModels.map((m: any) => ({
      id: m.id,
      name: m.name,
      pricing: m.pricing,
      capabilities: m.capabilities,
      multimodal: m.multimodal
    }))));

    // Map to our interface
    return visionModels.map((model: { 
      id: string, 
      name: string, 
      provider: string, 
      description?: string, 
      pricing?: { prompt?: number | string, completion?: number | string },
      context_length?: number
    }) => {
      // Parse pricing values as floats to ensure correct comparison
      // Use parseFloat to handle both string and number types
      const promptPrice = parseFloat(`${model.pricing?.prompt || 0}`);
      const completionPrice = parseFloat(`${model.pricing?.completion || 0}`);
      
      // A model is free if both prompt and completion prices are zero
      const isFree = promptPrice === 0 && completionPrice === 0;
      
      return {
        id: model.id,
        name: model.name,
        provider: model.provider,
        description: model.description || `${model.name} from ${model.provider}`,
        isFree: isFree,
        supportsImages: true,
        contextWindow: model.context_length || 4096,
        pricingInput: promptPrice,
        pricingOutput: completionPrice
      };
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

/**
 * Analyzes an image using a specific model through the OpenRouter API
 * @param imageBase64 Base64 string of the image to analyze
 * @param modelId OpenRouter model ID
 * @param apiKey OpenRouter API key
 * @param systemPrompt Optional custom system prompt for the model
 * @param maxTokens Optional max tokens for the response
 * @param temperature Optional temperature for response generation
 * @returns Analysis result with detections and metadata
 */
export async function analyzeImage(
  imageBase64: string,
  modelId: string,
  apiKey?: string,
  systemPrompt?: string,
  maxTokens?: number,
  temperature?: number
) {
  try {
    // Default system prompt for pest/species identification
    const defaultSystemPrompt = `You are an expert species identification AI. 
    Analyze the image carefully and identify any organisms present. 
    For each organism detected, provide its taxonomic classification and possible species names.
    Be thorough in your identification and provide detailed information about the species.`;
    
    // Headers for OpenRouter API - following official documentation
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (apiKey) {
      // OpenRouter API keys should start with 'sk-or-'
      const formattedKey = apiKey.startsWith('sk-or-') ? apiKey : `sk-or-${apiKey}`;
      headers['Authorization'] = `Bearer ${formattedKey}`;
      console.log('API key provided:', formattedKey.substring(0, 10) + '...');
    } else {
      console.log('No API key provided - vision models may not work without an API key');
      
      // Try to use environment variable as fallback
      const envApiKey = process.env.OPENROUTER_API_KEY;
      if (envApiKey) {
        const formattedEnvKey = envApiKey.startsWith('sk-or-') ? envApiKey : `sk-or-${envApiKey}`;
        headers['Authorization'] = `Bearer ${formattedEnvKey}`;
        console.log('Using environment API key');
      } else {
        console.warn('No API key available');
      }
    }

    // Add referrer info for OpenRouter leaderboards
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://pestiid-dashboard.app';
    headers['X-Title'] = 'PestID Dashboard';

    // Set up the request to OpenRouter
    const url = `${OPENROUTER_API_URL}/chat/completions`;
    
    // Build the request payload - following OpenRouter docs
    const payload = {
      model: modelId,
      messages: [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Analyze this image and identify any organisms present.'
            }
          ]
        }
      ],
      temperature: temperature !== undefined ? temperature : 0.2,
      max_tokens: maxTokens || 1024,
      random_seed: null,
      stream: false
    };
    
    console.log('Sending request to OpenRouter API for model:', modelId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = response.statusText;
      }
      
      throw new Error(`OpenRouter API error: ${response.status} - ${errorDetails}`);
    }

    // Get the raw response text first to ensure we don't lose it
    const rawResponseText = await response.text();
    console.log('OpenRouter raw response:', rawResponseText.substring(0, 200) + '...');
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(rawResponseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      // If we can't parse as JSON, create a minimal structure with the raw text
      data = {
        choices: [{
          message: {
            content: rawResponseText
          }
        }]
      };
    }
    
    // Extract the content from the response
    let responseText = '';
    
    // Check if we have a message content
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const messageContent = data.choices[0].message.content;
      const contentType = typeof messageContent;
      console.log('Content type:', contentType);
      
      if (contentType === 'string') {
        responseText = messageContent;
        console.log('Content preview:', responseText.substring(0, 200));
      } else if (contentType === 'object') {
        // Some models return content as an object or array
        responseText = JSON.stringify(messageContent);
        console.log('Content preview (object):', responseText.substring(0, 200));
      } else {
        // Fallback for unexpected content type
        responseText = String(messageContent);
        console.log('Content preview (converted):', responseText.substring(0, 200));
      }
    } else if (data.text) {
      // Some APIs might return a direct text property
      responseText = data.text;
      console.log('Using data.text property:', responseText.substring(0, 200));
    } else {
      // Last resort - use the raw response
      responseText = rawResponseText;
      console.log('Using raw response text as fallback');
    }
    
    try {
      // Initialize result with the raw text to ensure we always have something to return
      let finalResult: any = {
        detections: [],
        responseText: responseText
      };

      // For backward compatibility, try to extract structured data if possible,
      // but don't throw an error if it's not possible - we'll use the raw text instead
      try {
        // Check if the response is a JSON string (some models return JSON as a string)
        if (typeof responseText === 'string' && 
            (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
          
          console.log('Response appears to be JSON, attempting to parse');
          
          // Try to extract JSON from markdown code blocks if present
          let jsonStr = responseText;
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonStr = jsonMatch[1].trim();
            console.log('Extracted JSON from code block');
          }
          
          try {
            const parsed = JSON.parse(jsonStr);
            console.log('Successfully parsed JSON');
            
            // Handle various JSON structures models might return
            if (parsed.organisms) {
              console.log('Found organisms array in JSON');
              finalResult.detections = parsed.organisms.map((org: any) => ({
                taxonomy: {
                  species: org.species || org.Species || org.Genus || org.genus || "Unknown",
                  family: org.family || org.Family,
                  genus: org.genus || org.Genus,
                  details: JSON.stringify(org)
                }
              }));
            } 
            else if (parsed.detections) {
              console.log('Found detections array in JSON');
              finalResult.detections = parsed.detections;
            }
            else if (Array.isArray(parsed)) {
              console.log('Response is a direct array');
              finalResult.detections = parsed.map((item: any) => ({
                taxonomy: {
                  species: item.species || item.name || item.label || "Unknown",
                  details: JSON.stringify(item)
                }
              }));
            }
            else if (parsed.species || parsed.name) {
              console.log('Response is a single object with species info');
              finalResult.detections = [{
                taxonomy: {
                  species: parsed.species || parsed.name || "Unknown",
                  details: JSON.stringify(parsed)
                }
              }];
            }
          } catch (jsonError) {
            console.log('Failed to parse as JSON, using raw text', jsonError);
            // Not valid JSON, we'll use the raw text instead (which is fine for battle mode)
          }
        } else {
          console.log('Response is not JSON format, using raw text');
        }
      } catch (parsingError) {
        console.log('Error while trying to parse structured data:', parsingError);
        // Parsing failed but we'll continue with the raw text
      }
      
      // If we have no detections but we have raw text, use raw text response format only
      if (finalResult.detections.length === 0 && responseText) {
        console.log('Using raw text response format only - no structured detections needed');
        finalResult.detections = [];
      }

      // Log the final output for debugging
      console.log('Final response structure:', {
        hasResponseText: !!finalResult.responseText,
        textLength: finalResult.responseText ? finalResult.responseText.length : 0
      });

      // Return the combined result with model and usage info
      return {
        model: modelId,
        responseText: responseText,
        raw: data
      };
    } catch (parsingError) {
      console.error('Error parsing model response:', parsingError);
      
      // Ensure we always return something useful
      return {
        model: modelId,
        responseText: responseText || rawResponseText,
        raw: data
      };
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
