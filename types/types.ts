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
  family: string;
  genus: string;
  species: string;
  confidence: number;
  reasoning: string;
}

export interface Detection {
  box_2d: BoundingBox;
  taxonomy: Taxonomy;
  possible_species: string[];
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
  scientificName: string;
  boundingBoxes?: BoundingBox[];
  debug?: any;
  detections: Detection[];
}