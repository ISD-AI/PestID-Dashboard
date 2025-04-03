export interface BoundingBox {
  label: string;
  box_2d: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface Taxonomy {
  family?: string;
  genus?: string;
  species: string;
  confidence?: number;
  reasoning?: string;
  details?: string;
}

export interface Detection {
  taxonomy: Taxonomy;
  possible_species?: string[];
  box_2d?: BoundingBox;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface StreamingState {
  status: 'initial-detection' | 'refining' | 'complete';
  currentDetectionIndex: number;
  message: string;
}

export interface AnalysisResult {
  scientificName?: string;
  model?: string;
  responseText?: string;
  detections?: Detection[];
  usage?: any;
  debug?: any;
}

// Battle mode types
export interface BattleVote {
  vote: 'left' | 'right' | 'tie' | 'both-bad';
  timestamp: string;
}

export interface BattleModeResults {
  leftModel: string;
  leftResult: string;
  rightModel: string;
  rightResult: string;
  votes: BattleVote[];
}

// OpenRouter Model Types
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: any;
  context_length?: number;
  isFree?: boolean;
}

export interface OllamaModel {
  name: string;
}

export interface AnalysisProvider {
  type: 'openrouter' | 'ollama';
  baseUrl?: string; // For Ollama
  apiKey?: string;  // For OpenRouter
}

export interface AnalysisMode {
  type: 'free' | 'battle';
  selectedModels: string[];
  provider: AnalysisProvider;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}