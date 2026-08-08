import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';

const CropModal = ({ imageFile, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const imageRef = useRef();

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const onCropCompleteHandler = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;
    try {
      const image = new Image();
      image.src = URL.createObjectURL(imageFile);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], imageFile.name || 'cropped.jpg', { type: 'image/jpeg' });
      onCropComplete(file);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl mx-4 p-4 relative"
        style={{ height: '90vh', maxHeight: '600px' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-medium">Adjust Crop</h3>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="relative w-full h-full" style={{ height: 'calc(100% - 80px)' }}>
          <Cropper
            image={URL.createObjectURL(imageFile)}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9} // you can make this configurable
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createCroppedImage}
            className="px-4 py-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold rounded-lg transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CropModal;