import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  hasImage: boolean;
}

export function ImageUploader({ onUpload, onSubmit, isLoading, hasImage }: ImageUploaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center w-full gap-4 p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors">
        <UploadCloud className="w-10 h-10 text-gray-400" />
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-600">Drag and drop your image here, or</p>
          <Input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="mt-2 max-w-[300px]"
          />
        </div>
      </div>
      <Button 
        onClick={onSubmit} 
        disabled={!hasImage || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Analyze Image'}
      </Button>
    </div>
  );
}
