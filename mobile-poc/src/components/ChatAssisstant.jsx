import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Mic, Bot, Square, Loader2, Play, Pause, Volume2 } from 'lucide-react';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  // const [inputText, setInputText] = useState(""); // Text input state commented out
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to track conversation history for the AI context
  const [history, setHistory] = useState("");

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]); 
  const scrollRef = useRef(null);

  // Backend URL matching your FastAPI setup
  const BACKEND_URL = "http://127.0.0.1:8000/chat";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- API LOGIC ---
  const sendVoiceToBackend = async (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    // Keys match your FastAPI: file (UploadFile) and history (str)
    formData.append("file", audioBlob, "audio.wav");
    formData.append("history", history);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const resJson = await response.json();

        // Update Hidden Memory for the next turn
        setHistory(resJson.updated_history);

        // Process Sarvam AI's Base64 audio response
        const aiAudioUrl = `data:audio/wav;base64,${resJson.audio_base64}`;
        setMessages(prev => [...prev, {
          id: Date.now(),
          audioUrl: aiAudioUrl,
          sender: 'assistant',
          type: 'audio'
        }]);

        // Autoplay the assistant's reply
        const audio = new Audio(aiAudioUrl);
        audio.play();
      }
    } catch (e) {
      console.error("Connection Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RECORDING ENGINE ---
  async function startRecording() {
    audioChunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Add User's voice recording to UI
          setMessages(prev => [...prev, { 
            id: Date.now(), 
            audioUrl: audioUrl, 
            sender: 'user', 
            type: 'audio' 
          }]);

          // Trigger API call to Sarvam AI backend
          sendVoiceToBackend(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(1000); 
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone capture failed.");
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }

  /* // Text sending logic disabled for Voice-Only mode
  const handleSendText = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: inputText, sender: 'user', type: 'text' }]);
    setInputText("");
  }; 
  */

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-white text-[#2D4356] rounded-full shadow-2xl flex items-center justify-center z-[200] border border-gray-100 active:scale-95 transition-all">
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="absolute inset-0 bg-[#F9F9F7] z-[300] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white border-b border-gray-200 px-4 py-4 pt-8 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-[#2D4356]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2D4356]">Voice Assistant</span>
            </div>
            <X size={20} className="cursor-pointer text-gray-400" onClick={() => setIsOpen(false)} />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                  msg.sender === 'user' ? 'bg-[#2D4356] text-white' : 'bg-white text-[#2D4356] border border-gray-200'
                }`}>
                  {/* Text message rendering disabled */}
                  {msg.type === 'audio' && (
                    <AudioPlayer url={msg.audioUrl} isUser={msg.sender === 'user'} />
                  )}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="animate-spin text-gray-300 mx-auto" size={18} />}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 pb-10">
            <div className="flex items-center gap-2 justify-center">
              {/* Text Input Group Commented Out */}
              {/* <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200">
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isRecording ? "Recording..." : "Type here..."}
                  className="flex-1 py-3 text-xs outline-none bg-transparent font-medium"
                />
              </div> 
              */}

              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-[#2D4356] border border-gray-200'
                  }`}
                >
                  {isRecording ? <Square size={24} fill="white" /> : <Mic size={28} />}
                </button>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {isRecording ? "Stop" : "Hold to Talk"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AudioPlayer({ url, isUser }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef(new Audio(url));

  useEffect(() => {
    const a = audio.current;
    a.onended = () => setPlaying(false);
    return () => a.pause();
  }, [url]);

  const toggle = () => {
    if (playing) audio.current.pause();
    else audio.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 min-w-[150px] py-1">
      <button onClick={toggle} className={isUser ? "text-white" : "text-[#2D4356]"}>
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`w-[2px] rounded-full transition-all ${isUser ? 'bg-white/40' : 'bg-gray-300'} ${playing ? 'animate-pulse h-4' : 'h-2'}`} 
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}