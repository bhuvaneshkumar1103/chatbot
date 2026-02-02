import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Image as ImageIcon, Camera, Hash, Calendar, User, Mail, Car, Shield, Phone, Gauge, Check } from 'lucide-react';

export default function UploadRC() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('select'); // 'select' | 'loading' | 'form'

  const startProcessing = () => {
    setCurrentStep('loading');
    // Simulate OCR processing for 2 seconds
    setTimeout(() => setCurrentStep('form'), 2000);
  };

  const handleSave = () => {
    localStorage.setItem('step3_completed', 'true');
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

      <div className="flex-1 overflow-y-auto pb-20">
        {/* STEP 1: SELECT BUTTONS */}
        <div className="p-4">
          <div className="bg-[#D9CEBA] rounded-3xl p-6 shadow-sm border border-black/5 text-center">
            <p className="text-[11px] italic mb-6 px-4">
              Select a button below to upload an image of your RC book via camera or gallery.
            </p>
            <div className="flex justify-center gap-6">
              <button onClick={startProcessing} className="w-14 h-14 bg-[#435B71] rounded-full flex items-center justify-center text-white shadow-lg">
                <ImageIcon size={28} />
              </button>
              <button onClick={startProcessing} className="w-14 h-14 bg-[#435B71] rounded-full flex items-center justify-center text-white shadow-lg">
                <Camera size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3: VEHICLE DETAILS FORM */}
        {currentStep === 'form' && (
          <div className="px-6 py-2 space-y-4 animate-in fade-in duration-500">
            <h3 className="text-center font-bold text-lg mb-2">Vehicle Details</h3>
            
            <InputGroup label="Registration Number" icon={<Hash size={18}/>} value="TN95NEW" />
            <InputGroup label="Registration Date" icon={<Calendar size={18}/>} value="27-01-2026" />
            <InputGroup label="Owner Name" icon={<User size={18}/>} value="DHANALAKSHMI T" />
            <InputGroup label="Owner Address" icon={<Mail size={18}/>} value="21/10/1 MURUKANADARSANDH" />
            
            {/* Select Dropdowns */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold ml-3 text-gray-600 uppercase">Vehicle Type</label>
              <div className="relative">
                <select className="w-full bg-transparent border-2 border-[#435B71] rounded-xl py-3 px-10 appearance-none font-bold">
                  <option>Car</option>
                </select>
                <Car className="absolute left-3 top-3.5 text-gray-600" size={18} />
              </div>
            </div>

            <InputGroup label="Owner Mobile" icon={<Phone size={18}/>} value="9159358933" />
            <InputGroup label="Odometer Reading" icon={<Gauge size={18}/>} value="5" />

            {/* Sim Validity Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold">Sim Validity</span>
              <div className="flex bg-[#D9CEBA] rounded-full p-1 border border-[#435B71]/20">
                <button className="px-4 py-1 text-xs">1 year</button>
                <button className="px-4 py-1 text-xs bg-[#435B71] text-white rounded-full flex items-center gap-1">
                  <Check size={12}/> 2 year
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: OVERLAY LOADER */}
      {currentStep === 'loading' && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-8 z-50">
          <div className="bg-white/90 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-12 h-12 border-4 border-[#435B71] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-gray-800">Please wait while we process the image to extract the details.</p>
          </div>
        </div>
      )}

      {/* FOOTER SAVE BUTTON */}
      {currentStep === 'form' && (
        <div className="p-6 bg-[#C1B59F]">
          <button onClick={handleSave} className="w-full bg-[#2D4356] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg">
            SAVE
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component for clean input styling
function InputGroup({ label, icon, value }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold ml-3 text-gray-600 uppercase tracking-tight">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-3.5 text-gray-600">{icon}</div>
        <input 
          readOnly 
          className="w-full bg-transparent border-2 border-[#435B71] rounded-xl py-3 px-10 font-bold outline-none" 
          defaultValue={value} 
        />
      </div>
    </div>
  );
}