import { AnalysisResult, BattleModeResults } from '@/types/types';

export interface StoredAnalysisResult extends AnalysisResult {
  id: string;
  timestamp: string;
  imageUrl: string;
  imageName: string;
}

export interface StoredBattleResult extends BattleModeResults {
  id: string;
  timestamp: string;
  imageUrl: string;
  imageName: string;
}

export interface AnalysisHistoryItem {
  id: string;
  type: 'single' | 'battle';
  timestamp: string;
  imageUrl: string;
  imageName: string;
  models: string[];
  result: StoredAnalysisResult | StoredBattleResult;
}

const STORAGE_KEY = 'pestid-analysis-history';

/**
 * Save a single model analysis result to history
 */
export function saveAnalysisToHistory(
  result: AnalysisResult,
  imageUrl: string,
  imageName: string = 'unnamed-image.jpg'
): string {
  const history = getAnalysisHistory();
  const id = generateId();
  
  const item: AnalysisHistoryItem = {
    id,
    type: 'single',
    timestamp: new Date().toISOString(),
    imageUrl,
    imageName,
    models: [result.model || 'unknown-model'],
    result: {
      ...result,
      id,
      timestamp: new Date().toISOString(),
      imageUrl,
      imageName
    } as StoredAnalysisResult
  };
  
  history.unshift(item);
  
  // Limit history to 100 items to prevent storage issues
  if (history.length > 100) {
    history.pop();
  }
  
  saveHistory(history);
  return id;
}

/**
 * Save a battle mode result to history
 */
export function saveBattleToHistory(
  battleResults: BattleModeResults,
  imageUrl: string,
  imageName: string = 'unnamed-image.jpg'
): string {
  const history = getAnalysisHistory();
  const id = generateId();
  
  const item: AnalysisHistoryItem = {
    id,
    type: 'battle',
    timestamp: new Date().toISOString(),
    imageUrl,
    imageName,
    models: [battleResults.leftModel, battleResults.rightModel],
    result: {
      ...battleResults,
      id,
      timestamp: new Date().toISOString(),
      imageUrl,
      imageName
    } as StoredBattleResult
  };
  
  history.unshift(item);
  
  // Limit history to 100 items to prevent storage issues
  if (history.length > 100) {
    history.pop();
  }
  
  saveHistory(history);
  return id;
}

/**
 * Get all analysis history items
 */
export function getAnalysisHistory(): AnalysisHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    if (!storedHistory) {
      return [];
    }
    
    return JSON.parse(storedHistory);
  } catch (error) {
    console.error('Failed to parse analysis history:', error);
    return [];
  }
}

/**
 * Get a specific analysis history item by ID
 */
export function getAnalysisById(id: string): AnalysisHistoryItem | null {
  const history = getAnalysisHistory();
  return history.find(item => item.id === id) || null;
}

/**
 * Delete a specific analysis history item by ID
 */
export function deleteAnalysisById(id: string): boolean {
  const history = getAnalysisHistory();
  const newHistory = history.filter(item => item.id !== id);
  
  if (newHistory.length === history.length) {
    return false; // Item not found
  }
  
  saveHistory(newHistory);
  return true;
}

/**
 * Clear all analysis history
 */
export function clearAnalysisHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Filter history by model name
 */
export function filterHistoryByModel(modelName: string): AnalysisHistoryItem[] {
  const history = getAnalysisHistory();
  return history.filter(item => item.models.includes(modelName));
}

/**
 * Filter history by date range
 */
export function filterHistoryByDateRange(startDate: Date, endDate: Date): AnalysisHistoryItem[] {
  const history = getAnalysisHistory();
  return history.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

// Helper functions
function saveHistory(history: AnalysisHistoryItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save analysis history:', error);
  }
}

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
