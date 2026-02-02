import { useState } from 'react';
import { ArrowLeft, RotateCcw, QrCode, Search, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeviceValidation() {
  const navigate = useNavigate();
  const [isFetched, setIsFetched] = useState(false);
  const [imei, setImei] = useState("");

  const handleSave = () => {
    // In a real app, you'd update a global state or database here
    localStorage.setItem('step1_completed', 'true');
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-[#C1B59F] font-sans text-[#2D4356]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-black/10">
        <div className="flex items-center gap-4">
          <Menu size={24} />
          <h2 className="font-bold text-lg">Validate Device</h2>
        </div>
      </div>

      <div className="p-4 flex-1">
        {/* Input Card */}
        <div className="bg-[#D9CEBA] rounded-3xl p-6 shadow-inner border border-black/5 mb-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
              <QrCode size={40} />
            </div>
          </div>
          
          <p className="text-center text-xs font-medium mb-4 px-4 leading-relaxed">
            Scan the IMEI using the button above, or enter it manually in the text box.
          </p>

          <div className="relative flex items-center">
            <div className="absolute left-3 text-gray-500 font-bold">#</div>
            <input 
              className="w-full bg-[#D9CEBA] border-2 border-[#435B71] rounded-lg py-3 pl-8 pr-12 outline-none font-mono"
              placeholder="Enter IMEI number"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
            <button 
              onClick={() => setIsFetched(true)}
              className="absolute right-0 bg-[#435B71] h-full px-4 rounded-r-lg text-white"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Specifications Section (Conditional) */}
        {isFetched && (
          <div className="px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold border-b border-[#2D4356] inline-block mb-4 text-sm uppercase tracking-wider">
              Device Specifications
            </h3>
            
            <div className="space-y-3 text-sm">
              {[
                { label: "IMEI", val: "861850061689812" },
                { label: "ICCID1", val: "89919409129446897315" },
                { label: "ICCID2", val: "89917350730001779971" },
                { label: "SIM1", val: "5754181990859" },
                { label: "SIM2", val: "5752000726132" },
                { label: "Serial No", val: "APM1N1A1122500010314" },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between font-medium">
                  <span className="font-bold uppercase text-[11px]">{spec.label}</span>
                  <span className="font-mono text-[11px]">{spec.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Save Button */}
      {isFetched && (
        <div className="p-4">
          <button 
            onClick={handleSave}
            className="w-full bg-[#435B71] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-black/20"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}