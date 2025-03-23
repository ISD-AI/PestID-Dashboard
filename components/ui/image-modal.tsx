// components/ui/image-modal.tsx
'use client';

import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { ExternalImage } from './external-image';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, altText }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden z-50">
        <DialogTitle className="sr-only">
          {altText}
        </DialogTitle>
        <DialogClose className="absolute right-4 top-4 p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-90 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="relative w-full aspect-video bg-black">
          <ExternalImage
            src={imageUrl}
            alt={altText}
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}