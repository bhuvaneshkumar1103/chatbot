import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function HealthCheck() {
  const navigate = useNavigate();

  const handleSave = () => {
    // 1. Save the completion status
    localStorage.setItem('step2_completed', 'true');
    // 2. Go back to the main list
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-[#C1B59F] text-[#2D4356] font-sans">
      {/* Header */}
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft onClick={() => navigate('/')} className="cursor-pointer" size={20} />
          <h2 className="text-sm font-medium">January 24, 2026</h2>
        </div>
        <RotateCcw size={18} className="text-gray-300" />
      </div>

      <div className="flex-1">
        {/* Map Section */}
        <div className="p-4">
          <div className="w-full h-64 bg-[#e5e7eb] rounded-lg shadow-inner relative overflow-hidden border border-black/10">
            {/* Simple Map Grid Pattern */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {/* Map Pin */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Info & Status */}
        <div className="px-6 py-4 text-center">
          <p className="text-xs font-medium opacity-70 mb-6">
            Last Update: 24-01-2026 03:59:31 PM
          </p>

          <div className="flex items-center justify-center gap-2 mb-12">
            <CheckCircle2 size={32} className="text-green-600" />
            <span className="text-2xl font-bold text-green-700">Device okay</span>
            <RotateCcw size={20} className="text-[#2D4356] ml-1" />
          </div>

          <p className="text-[10px] leading-relaxed opacity-60 mt-10">
            By clicking Save below, you confirm <br /> successful verification of the device.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-6">
        <button 
          onClick={handleSave}
          className="w-full bg-[#2D4356] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg"
        >
          Save
        </button>
      </div>
    </div>
  );
}