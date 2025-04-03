import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route for storing model comparison votes from battle mode
 * This implementation stores votes in a JSON file, but could be modified to use a database
 */

// Define the structure of a vote record
interface VoteRecord {
  id: string;
  timestamp: string;
  leftModel: string;
  rightModel: string;
  vote: 'left' | 'right' | 'tie' | 'both-bad';
  image?: string; // Optional filename of the analyzed image
}

// File path for storing votes
const DATA_DIR = path.join(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'model-votes.json');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize votes file if it doesn't exist
if (!fs.existsSync(VOTES_FILE)) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify([]));
}

// Handle POST requests to save votes
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.leftModel || !data.rightModel || !data.vote) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }
    
    // Validate vote value
    if (!['left', 'right', 'tie', 'both-bad'].includes(data.vote)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid vote value' 
        },
        { status: 400 }
      );
    }
    
    // Create vote record
    const vote: VoteRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      leftModel: data.leftModel,
      rightModel: data.rightModel,
      vote: data.vote,
      image: data.image
    };
    
    // Read existing votes
    const existingVotes: VoteRecord[] = JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
    
    // Add new vote and save
    existingVotes.push(vote);
    fs.writeFileSync(VOTES_FILE, JSON.stringify(existingVotes, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Vote recorded successfully',
      vote: vote
    });
  } catch (error) {
    console.error('Error saving vote:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save vote', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests to retrieve vote statistics
export async function GET(req: Request) {
  try {
    // Read votes file
    const votes: VoteRecord[] = JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
    
    // Calculate basic statistics
    const totalVotes = votes.length;
    
    // Count votes by type
    const voteCount = {
      left: votes.filter(v => v.vote === 'left').length,
      right: votes.filter(v => v.vote === 'right').length,
      tie: votes.filter(v => v.vote === 'tie').length,
      'both-bad': votes.filter(v => v.vote === 'both-bad').length
    };
    
    // Get model stats (which models are performing better)
    const modelStats: Record<string, { wins: number, losses: number, ties: number }> = {};
    
    votes.forEach(vote => {
      // Skip 'both-bad' votes for model performance calculations
      if (vote.vote === 'both-bad') return;
      
      // Initialize model stats if needed
      if (!modelStats[vote.leftModel]) {
        modelStats[vote.leftModel] = { wins: 0, losses: 0, ties: 0 };
      }
      if (!modelStats[vote.rightModel]) {
        modelStats[vote.rightModel] = { wins: 0, losses: 0, ties: 0 };
      }
      
      // Update stats based on vote
      if (vote.vote === 'left') {
        modelStats[vote.leftModel].wins++;
        modelStats[vote.rightModel].losses++;
      } else if (vote.vote === 'right') {
        modelStats[vote.leftModel].losses++;
        modelStats[vote.rightModel].wins++;
      } else if (vote.vote === 'tie') {
        modelStats[vote.leftModel].ties++;
        modelStats[vote.rightModel].ties++;
      }
    });
    
    return NextResponse.json({
      success: true,
      totalVotes,
      voteCount,
      modelStats,
      // Include last 10 votes for reference
      recentVotes: votes.slice(-10).reverse()
    });
    
  } catch (error) {
    console.error('Error retrieving votes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve votes', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
