'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Equal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface BattleModeProps {
  leftModelName: string;
  rightModelName: string;
  leftModelResult: string;
  rightModelResult: string;
  onVote: (vote: 'left' | 'right' | 'tie' | 'both-bad') => void;
  isLoading: boolean;
  className?: string;
}

export function BattleMode({
  leftModelName,
  rightModelName,
  leftModelResult,
  rightModelResult,
  onVote,
  isLoading,
  className
}: BattleModeProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'left' | 'right' | 'tie' | 'both-bad' | null>(null);

  // Handle vote with feedback
  const handleVote = (vote: 'left' | 'right' | 'tie' | 'both-bad') => {
    setSelectedVote(vote);
    setHasVoted(true);
    onVote(vote);
    
    // Optional: You could add a toast notification here
    console.log(`Vote recorded: ${vote}`);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Model Results */}
        <Card className={cn("h-full", selectedVote === 'left' ? "ring-2 ring-primary" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex justify-between items-center">
              <span className="truncate">{leftModelName || "Model A"}</span>
              <span className="text-xs text-muted-foreground">Left</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto bg-muted/20 rounded-md p-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse">Loading results...</div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none markdown-content">
                <ReactMarkdown>
                  {leftModelResult || "No results yet"}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Model Results */}
        <Card className={cn("h-full", selectedVote === 'right' ? "ring-2 ring-primary" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex justify-between items-center">
              <span className="truncate">{rightModelName || "Model B"}</span>
              <span className="text-xs text-muted-foreground">Right</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto bg-muted/20 rounded-md p-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse">Loading results...</div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none markdown-content">
                <ReactMarkdown>
                  {rightModelResult || "No results yet"}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isLoading && leftModelResult && rightModelResult && (
        <div className="flex flex-col items-center pt-4 space-y-4">
          {hasVoted ? (
            <div className="flex flex-col items-center space-y-2 p-4 bg-muted/10 rounded-lg w-full">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <h3 className="text-lg font-medium">Thank you for your feedback!</h3>
              <p className="text-sm text-muted-foreground text-center">
                Your vote has been recorded. You selected: 
                <span className="font-medium ml-1">
                  {selectedVote === 'left' && "Left model is better"}
                  {selectedVote === 'right' && "Right model is better"}
                  {selectedVote === 'tie' && "It's a tie"}
                  {selectedVote === 'both-bad' && "Both models are inaccurate"}
                </span>
              </p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setHasVoted(false)}
              >
                Vote Again
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium">Which model performed better?</h3>
              <div className="flex flex-wrap gap-4 justify-center w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 hover:bg-primary/10 transition-colors"
                  onClick={() => handleVote('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Left is Better</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 hover:bg-primary/10 transition-colors"
                  onClick={() => handleVote('tie')}
                >
                  <Equal className="h-4 w-4" />
                  <span>It's a Tie</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[150px] flex items-center justify-center space-x-2 hover:bg-primary/10 transition-colors"
                  onClick={() => handleVote('right')}
                >
                  <span>Right is Better</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2 text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => handleVote('both-bad')}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Both are Inaccurate</span>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
