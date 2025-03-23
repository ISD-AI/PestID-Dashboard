// components/verification/VerificationForm.tsx
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bug, CheckCircle, XCircle } from 'lucide-react';
import { PaginatedDetection } from '@/types/detection';
import { SuggestionModal } from './SuggestionModal';

interface VerificationFormProps {
  detection: PaginatedDetection;
  onVerify: (id: string, status: 'verified' | 'rejected', data: any) => void;
}

export function VerificationForm({ detection, onVerify }: VerificationFormProps) {
  const [comment, setComment] = useState('');
  const [confidence, setConfidence] = useState<number>(100);
  const [category, setCategory] = useState<string>('');
  const [needsExpertReview, setNeedsExpertReview] = useState<string>('');
  const [canReuseForAI, setCanReuseForAI] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [species, setSpecies] = useState('');
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  // Proxy both inputImageURL and predImageURL to avoid CORS issues
  const proxiedInputImageURL = detection.inputImageURL
    ? `/api/proxy-image?url=${encodeURIComponent(detection.inputImageURL)}`
    : undefined;
  const proxiedPredImageURL = detection.predImageURL
    ? `/api/proxy-image?url=${encodeURIComponent(detection.predImageURL)}`
    : undefined;

  const handleReject = () => setIsRejecting(true);

  const handleCancel = () => {
    setIsRejecting(false);
  };

  const handleVerify = () => {
    if (!category || !needsExpertReview || !canReuseForAI) {
      alert('Please fill all required fields.');
      return;
    }

    onVerify(detection.detectionID, 'verified', {
      confidence,
      comment,
      category,
      needsExpertReview: needsExpertReview === 'yes',
      canReuseForAI: canReuseForAI === 'yes',
      correctSpecies: species !== detection.scientificName ? species : undefined,
    });

    resetForm();
  };

  const handleSubmitRejection = () => {
    if (!category || !needsExpertReview || !canReuseForAI) {
      alert('Please fill all required fields.');
      return;
    }

    onVerify(detection.detectionID, 'rejected', {
      confidence,
      comment,
      category,
      needsExpertReview: needsExpertReview === 'yes',
      canReuseForAI: canReuseForAI === 'yes',
      correctSpecies: species,
    });

    resetForm();
  };

  const resetForm = () => {
    setComment('');
    setConfidence(100);
    setCategory('');
    setNeedsExpertReview('');
    setCanReuseForAI('');
    setSpecies(detection.scientificName || '');
    setIsRejecting(false);
    setIsSuggestionModalOpen(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3 pb-4 mb-4 border-b">
          <h4 className="font-medium">Category</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="category-unrelated"
                name="category"
                value="unrelated"
                checked={category === 'unrelated'}
                onChange={() => setCategory('unrelated')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="category-unrelated" className="flex items-center cursor-pointer">
                <Bug className="h-4 w-4 mr-1 text-gray-600" /> Unrelated
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="category-google-sourced"
                name="category"
                value="google-sourced"
                checked={category === 'google-sourced'}
                onChange={() => setCategory('google-sourced')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="category-google-sourced" className="flex items-center cursor-pointer">
                <Bug className="h-4 w-4 mr-1 text-blue-600" /> Google-Sourced
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="category-real-pest"
                name="category"
                value="real-pest"
                checked={category === 'real-pest'}
                onChange={() => setCategory('real-pest')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="category-real-pest" className="flex items-center cursor-pointer">
                <Bug className="h-4 w-4 mr-1 text-green-600" /> Real Observation
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="category-unknown-species"
                name="category"
                value="unknown-species"
                checked={category === 'unknown-species'}
                onChange={() => setCategory('unknown-species')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="category-unknown-species" className="flex items-center cursor-pointer">
                <Bug className="h-4 w-4 mr-1 text-red-600" /> Unknown Species
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-4 mb-4 border-b">
          <h4 className="font-medium">Needs Expert Review</h4>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="expert-review-yes"
                name="expert-review"
                value="yes"
                checked={needsExpertReview === 'yes'}
                onChange={() => setNeedsExpertReview('yes')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="expert-review-yes" className="cursor-pointer">
                Yes
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="expert-review-no"
                name="expert-review"
                value="no"
                checked={needsExpertReview === 'no'}
                onChange={() => setNeedsExpertReview('no')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="expert-review-no" className="cursor-pointer">
                No
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-4 mb-4 border-b">
          <h4 className="font-medium">Can Reuse Data for AI Development</h4>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="reuse-ai-yes"
                name="reuse-ai"
                value="yes"
                checked={canReuseForAI === 'yes'}
                onChange={() => setCanReuseForAI('yes')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="reuse-ai-yes" className="cursor-pointer">
                Yes
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="reuse-ai-no"
                name="reuse-ai"
                value="no"
                checked={canReuseForAI === 'no'}
                onChange={() => setCanReuseForAI('no')}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="reuse-ai-no" className="cursor-pointer">
                No
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Suggested Species Name</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter scientific name"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setIsSuggestionModalOpen(true)}
              className="whitespace-nowrap"
            >
              Get Suggestions
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Verification Confidence</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium w-8">{confidence}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Verification Notes</label>
          <Textarea
            placeholder="Optional notes about this verification..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {isRejecting && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSubmitRejection}
              disabled={!species || !needsExpertReview || !canReuseForAI}
            >
              Submit Rejection
            </Button>
          </div>
        )}
      </CardContent>

      {!isRejecting && (
        <CardFooter className="justify-between pt-0 px-6 pb-6 space-x-4">
          <Button variant="outline" onClick={handleReject} className="w-full">
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={!category || !needsExpertReview || !canReuseForAI}
          >
            <CheckCircle className="h-4 w-4 mr-2" /> Verify
          </Button>
        </CardFooter>
      )}

      {isSuggestionModalOpen && (
        <SuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => setIsSuggestionModalOpen(false)}
          inputImageURL={proxiedInputImageURL} // Use proxied URL
          predImageURL={proxiedPredImageURL}   // Use proxied URL
          onSelectSuggestion={(species) => setSpecies(species)}
        />
      )}
    </Card>
  );
}