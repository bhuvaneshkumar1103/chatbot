import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Image as ImageIcon, Camera } from 'lucide-react';

export default function UploadPhotos() {
  const navigate = useNavigate();

  const handleSave = () => {
    localStorage.setItem('step4_completed', 'true');
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-[#C1B59F] text-[#2D4356]">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft onClick={() => navigate('/')} className="cursor-pointer" size={20} />
          <h2 className="text-sm font-medium">January 24, 2026</h2>
        </div>
        <RotateCcw size={18} className="text-gray-300" />
      </div>

      <div className="flex-1 p-4 space-y-6">
        <UploadCard title="Fitment device" />
        <UploadCard title="your vehicle" />
      </div>

      <div className="p-6">
        <button onClick={handleSave} className="w-full bg-[#2D4356] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">
          SAVE
        </button>
      </div>
    </div>
  );
}

function UploadCard({ title }) {
  return (
    <div className="bg-[#D9CEBA] rounded-3xl p-8 shadow-sm border border-black/5 text-center">
      <p className="text-[11px] italic mb-6 px-4">
        Select a button below to upload an image of {title} via camera or gallery.
      </p>
      <div className="flex justify-center gap-6">
        <div className="w-14 h-14 bg-[#435B71] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer">
          <ImageIcon size={28} />
        </div>
        <div className="w-14 h-14 bg-[#435B71] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer">
          <Camera size={28} />
        </div>
      </div>
    </div>
  );
}