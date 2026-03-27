import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Crop, Image as ImageIcon, Loader2 } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onComplete: (croppedImage: File) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, imageFile, onClose, onComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject(new Error('Canvas is empty'));
      }, 'image/png');
    });
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], imageFile?.name || 'cropped.png', { type: 'image/png' });
      onComplete(croppedFile);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء اقتصاص الصورة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const bgRemovedBlob = await removeBackground(croppedBlob);
      const finalFile = new File([bgRemovedBlob], imageFile?.name || 'bg-removed.png', { type: 'image/png' });
      onComplete(finalFile);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إزالة الخلفية');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Crop className="h-5 w-5 text-indigo-600" />
            تعديل الصورة
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative flex-1 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">أبعاد القص</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setAspect(1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aspect === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>1:1 (مربع)</button>
              <button onClick={() => setAspect(4/3)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aspect === 4/3 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>4:3</button>
              <button onClick={() => setAspect(16/9)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aspect === 16/9 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>16:9</button>
              <button onClick={() => setAspect(3/4)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aspect === 3/4 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>3:4 (طولي)</button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">تكبير / تصغير</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              dir="ltr"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crop className="h-5 w-5" />}
              اقتصاص فقط
            </button>
            <button 
              onClick={handleRemoveBackground}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              إزالة الخلفية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
