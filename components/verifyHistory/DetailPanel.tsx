// components/verification/VerificationDetailPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Save, RotateCcw, Pencil, Eye, Clock } from 'lucide-react';
import { Verification, VerificationStatus } from '@/types/verification';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import { SuggestionModal } from '@/components/verification/SuggestionModal';
import { ExternalImage } from '@/components/ui/external-image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";

interface VerificationDetailPanelProps {
  verificationId: string | null;
  onSave: () => void;
}

export function VerificationDetailPanel({ verificationId, onSave }: VerificationDetailPanelProps) {
  const [verification, setVerification] = useState<Verification & { predImageURL?: string; inputImageURL?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [proxiedInputImageURL, setProxiedInputImageURL] = useState<string | undefined>(undefined);
  const [proxiedPredImageURL, setProxiedPredImageURL] = useState<string | undefined>(undefined);
  const {user } = useUser();

  // Form state
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.PENDING);
  const [category, setCategory] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [needsExpertReview, setNeedsExpertReview] = useState(false);
  const [canReuseData, setCanReuseData] = useState(false);
  const [confidence, setConfidence] = useState(100);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      if (!verificationId) {
        setVerification(null);
        setProxiedInputImageURL(undefined);
        setProxiedPredImageURL(undefined);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/verificationHistory?id=${verificationId}`);
        if (!response.ok) throw new Error('Failed to fetch verification');
        
        const data = await response.json();
        if (data.success && data.verification) {
          setVerification(data.verification);
          
          // Set proxied URLs
          if (data.verification.inputImageURL) {
            setProxiedInputImageURL(`/api/proxy-image?url=${encodeURIComponent(data.verification.inputImageURL)}`);
          }
          if (data.verification.predImageURL) {
            setProxiedPredImageURL(`/api/proxy-image?url=${encodeURIComponent(data.verification.predImageURL)}`);
          }
          
          // Set form values
          setStatus(data.verification.status);
          setCategory(data.verification.category || '');
          setSuggestedName(data.verification.correctSciName || '');
          setNeedsExpertReview(data.verification.needsExpertReview || false);
          setCanReuseData(data.verification.canReuseData || false);
          setConfidence(data.verification.confidence || 100);
          setNotes(data.verification.notes || '');
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
        toast.error('Failed to load verification details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerification();
  }, [verificationId]);

  const handleSave = async () => {
    if (!verification || !reason) {
      toast.error('Please provide a reason for this change');
      return;
    }
    
    setSaving(true);
    try {
      const updates = {
        status,
        category,
        correctSciName: suggestedName || null,
        needsExpertReview,
        canReuseForAI: canReuseData,
        confidence,
        notes,
      };
      
      const response = await fetch(`/api/verificationHistory?id=${verification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          changedBy: user?.firstName?.trim(), // This would come from the user context in a real app
          reason,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update verification');
      
      // After successful save, refresh the verification data
      setRefreshing(true);
      const refreshResponse = await fetch(`/api/verificationHistory?id=${verification.id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        if (data.success && data.verification) {
          setVerification(data.verification);
          
          // Update form state with fresh data
          setStatus(data.verification.status);
          setCategory(data.verification.category || '');
          setSuggestedName(data.verification.correctSciName || '');
          setNeedsExpertReview(data.verification.needsExpertReview || false);
          setCanReuseData(data.verification.canReuseData || false);
          setConfidence(data.verification.confidence || 100);
          setNotes(data.verification.notes || '');
        }
      }
      
      toast.success('Verification updated successfully');
      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    } finally {
      setSaving(false);
      setRefreshing(false);
    }
  };

  const handleCancel = () => {
    // Reset form values to original verification data
    if (verification) {
      setStatus(verification.status);
      setCategory(verification.category || '');
      setSuggestedName(verification.correctSciName || '');
      setNeedsExpertReview(verification.needsExpertReview || false);
      setCanReuseData(verification.canReuseData || false);
      setConfidence(verification.confidence || 100);
      setNotes(verification.notes || '');
    }
    setReason('');
    setIsEditing(false);
  };

  if (!verificationId) {
    return (
      <Card className="h-full bg-muted/5 shadow-sm border-dashed flex items-center justify-center">
        <CardContent className="text-center py-10">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-muted-foreground">Select a verification history record to view details</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/10">
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!verification) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Verification not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm flex flex-col">
      <CardHeader className="border-b bg-muted/10 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Verification Details</span>
          {!isEditing ? (
            <Button size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 overflow-y-auto flex-grow relative">
        {refreshing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Refreshing...</span>
            </div>
          </div>
        )}
        
        {/* Detection Image */}
        <div className="space-y-2">
          <Label>Detection Image</Label>
          <div className="border rounded overflow-hidden">
            {verification.predImageURL || verification.inputImageURL ? (
              <div className="relative aspect-video bg-muted/10">
                <ExternalImage
                  src={verification.predImageURL || verification.inputImageURL}
                  alt="Detection image"
                  className="object-contain w-full h-full"
                />
                <Link 
                  href={`/dashboard/detections/${verification.predID}`}
                  className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80"
                >
                  View Details
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 bg-muted/10">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Prediction Document ID</Label>
          <div className="p-2 border rounded bg-muted/20">
            <Link
              href={`/dashboard/detections/${verification.predID}`}
              className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {verification.predID}
            </Link>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Status</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-verified"
                  name="status"
                  checked={status === VerificationStatus.VERIFIED}
                  onChange={() => setStatus(VerificationStatus.VERIFIED)}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-verified" className="flex items-center cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" /> Verified
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-rejected"
                  name="status"
                  checked={status === VerificationStatus.REJECTED}
                  onChange={() => setStatus(VerificationStatus.REJECTED)}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-rejected" className="flex items-center cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-500 mr-1" /> Rejected
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-pending"
                  name="status"
                  checked={status === VerificationStatus.PENDING}
                  onChange={() => setStatus(VerificationStatus.PENDING)}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-pending" className="flex items-center cursor-pointer">
                    <Clock className="h-4 w-4 text-yellow-500 mr-1" /> Pending
                </Label>
              </div>
            </div>
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              {verification.status === VerificationStatus.VERIFIED ? (
                <span className="text-green-500 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Verified
                </span>
              ) : verification.status === VerificationStatus.REJECTED ? (
                <span className="text-red-500 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" /> Rejected
                </span>
              ) : (
                <span className="text-yellow-500 flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Pending
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Category</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="category-unrelated"
                  name="category"
                  value="unrelated"
                  checked={category === 'unrelated'}
                  onChange={() => setCategory('unrelated')}
                  className="h-4 w-4"
                />
                <Label htmlFor="category-unrelated">Unrelated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="category-google-sourced"
                  name="category"
                  value="google-sourced"
                  checked={category === 'google-sourced'}
                  onChange={() => setCategory('google-sourced')}
                  className="h-4 w-4"
                />
                <Label htmlFor="category-google-sourced">Google-Sourced</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="category-real-pest"
                  name="category"
                  value="real-pest"
                  checked={category === 'real-pest'}
                  onChange={() => setCategory('real-pest')}
                  className="h-4 w-4"
                />
                <Label htmlFor="category-real-pest">Real Observation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="category-unknown-species"
                  name="category"
                  value="unknown-species"
                  checked={category === 'unknown-species'}
                  onChange={() => setCategory('unknown-species')}
                  className="h-4 w-4"
                />
                <Label htmlFor="category-unknown-species">Unknown Species</Label>
              </div>
            </div>
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              <span className="capitalize">{verification.category || 'Not specified'}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Suggested Scientific Name</Label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                placeholder="Enter scientific name"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setIsSuggestionModalOpen(true)}
                type="button"
              >
                Get Suggestions
              </Button>
            </div>
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              <span className="italic">{verification.correctSciName || 'None'}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Verification Confidence</Label>
          {isEditing ? (
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
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                      {verification.confidence}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ width: `${verification.confidence}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Needs Expert Review</Label>
          {isEditing ? (
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="expert-review-yes"
                  name="expert-review"
                  checked={needsExpertReview}
                  onChange={() => setNeedsExpertReview(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="expert-review-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="expert-review-no"
                  name="expert-review"
                  checked={!needsExpertReview}
                  onChange={() => setNeedsExpertReview(false)}
                  className="h-4 w-4"
                />
                <Label htmlFor="expert-review-no">No</Label>
              </div>
            </div>
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              {verification.needsExpertReview ? 'Yes' : 'No'}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Can Reuse for AI</Label>
          {isEditing ? (
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="reuse-ai-yes"
                  name="reuse-ai"
                  checked={canReuseData}
                  onChange={() => setCanReuseData(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="reuse-ai-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="reuse-ai-no"
                  name="reuse-ai"
                  checked={!canReuseData}
                  onChange={() => setCanReuseData(false)}
                  className="h-4 w-4"
                />
                <Label htmlFor="reuse-ai-no">No</Label>
              </div>
            </div>
          ) : (
            <div className="p-2 border rounded bg-muted/20">
              {verification.canReuseData ? 'Yes' : 'No'}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Notes</Label>
          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes about this verification"
              rows={3}
            />
          ) : (
            <div className="p-2 border rounded bg-muted/20 min-h-[60px]">
              {verification.notes || 'No notes'}
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-red-500">* Reason for Change</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this change"
              rows={2}
              className="border-red-200 focus:border-red-300"
              required
            />
          </div>
        )}
      </CardContent>

      {/* Add the Suggestion Modal */}
      {isSuggestionModalOpen && (
        <SuggestionModal
         isOpen={isSuggestionModalOpen}
         onClose={() => setIsSuggestionModalOpen(false)}
         inputImageURL={proxiedInputImageURL}
         predImageURL={proxiedPredImageURL}
         onSelectSuggestion={(species) => {
           setSuggestedName(species);
           setIsSuggestionModalOpen(false);
         }}
       />
      )}
    </Card>
  );
}