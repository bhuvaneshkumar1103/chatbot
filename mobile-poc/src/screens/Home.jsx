import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Activity, Book, CloudUpload, CheckCircle2, RotateCcw, Menu, Phone, CheckCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [stepsStatus, setStepsStatus] = useState({ 1: false, 2: false, 3: false, 4: false });

  useEffect(() => {
    setStepsStatus({
      1: localStorage.getItem('step1_completed') === 'true',
      2: localStorage.getItem('step2_completed') === 'true',
      3: localStorage.getItem('step3_completed') === 'true',
      4: localStorage.getItem('step4_completed') === 'true',
    });
  }, []);

  const allDone = stepsStatus[1] && stepsStatus[2] && stepsStatus[3] && stepsStatus[4];

  const handleFinalReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const steps = [
    { id: 1, title: "Validate Device", icon: <QrCode size={20}/>, path: '/validate' },
    { id: 2, title: "Health Check", icon: <Activity size={20}/>, path: '/health' },
    { id: 3, title: "Upload RC Book", icon: <Book size={20}/>, path: '/upload-rc' },
    { id: 4, title: "Upload Photos", icon: <CloudUpload size={20}/>, path: '/upload-photos' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#C1B59F] text-[#2D4356] relative">
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <Menu size={20} />
        <span className="text-xs font-bold tracking-widest">VLV PROTECT</span>
        <RotateCcw size={18} className="cursor-pointer" onClick={() => window.location.reload()} />
      </header>

      {/* Profile Card */}
      <div className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm text-center">
        <h1 className="font-bold text-xl text-blue-900 uppercase tracking-tight">srinivasan</h1>
        <p className="text-[10px] mb-4 opacity-70">Complete the following steps to finalize device registration.</p>
        
        {stepsStatus[1] && (
          <div className="space-y-2 animate-in fade-in zoom-in duration-300">
            <InfoRow label="IMEI" value="861850061689812" />
            <InfoRow label="MANF" value="Basheer" />
            <InfoRow label="MAN PH" value="9655543732" icon={<Phone size={10}/>} />
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="p-6 space-y-3 flex-1 overflow-y-auto">
        {steps.map((step, idx) => {
          const isCompleted = stepsStatus[step.id];
          const isLocked = idx > 0 && !stepsStatus[steps[idx - 1].id];
          const isCurrent = !isCompleted && !isLocked;

          return (
            <div 
              key={step.id} 
              onClick={() => (isCurrent || isCompleted) && navigate(step.path)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                ${(isCurrent || isCompleted) ? 'bg-white border-transparent shadow-sm' : 'bg-white/20 border-white/10'}
                ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 cursor-pointer active:scale-95'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${(isCurrent || isCompleted) ? 'bg-[#435B71] text-white' : 'bg-gray-500 text-white'}`}>
                  {step.icon}
                </div>
                <span className={`font-bold text-sm ${isLocked ? 'text-gray-600' : 'text-[#435B71]'}`}>
                  {step.title}
                </span>
              </div>
              {isCompleted && <CheckCircle2 size={20} className="text-green-600 animate-in zoom-in" />}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-6 bg-[#C1B59F] border-t border-black/5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleFinalReset} className="bg-[#4a4a4a] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg">
            RESET
          </button>
          <button 
            disabled={!allDone}
            onClick={() => setShowSuccess(true)}
            className={`py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg transition-all
              ${allDone ? 'bg-[#2D4356] text-white' : 'bg-gray-400 text-gray-200 opacity-50'}
            `}
          >
            REGISTER DEVICE
          </button>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-[100] backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 w-full flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-[#2D4356]" />
            </div>
            <h2 className="text-xl font-bold mb-1">Success</h2>
            <p className="text-gray-500 text-xs mb-8">Device Registered Successfully</p>
            <button 
              onClick={handleFinalReset}
              className="w-full bg-[#2D4356] text-white py-4 rounded-2xl font-bold text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="bg-[#435B71] text-white rounded-full py-1.5 px-4 flex justify-between items-center text-[10px] font-medium">
      <span className="opacity-70 font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <span>{value}</span>
        {icon}
      </div>
    </div>
  );
}