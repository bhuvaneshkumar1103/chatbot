import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, Bot, Play, Pause, MapPin } from 'lucide-react';
import { submitAudioChat, continueChat, getMediaFile, startGpsAction } from '../api/chatbot';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fitterId, setFitterId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [sseClient, setSseClient] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [gpsClicked, setGpsClicked] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Generate random fitter ID only once on initial load
    let savedFitterId = localStorage.getItem('fitter_id');
    if (!savedFitterId) {
      savedFitterId = `FITTER${Math.floor(Math.random() * 9000) + 1000}`;
      localStorage.setItem('fitter_id', savedFitterId);
    }
    setFitterId(savedFitterId);

    const checkStorage = () => {
      const savedDeviceId = localStorage.getItem('device_id');
      if (savedDeviceId) {
        setDeviceId(savedDeviceId);
      }

      const validationComplete = localStorage.getItem('step1_completed') === 'true';
      const isChatEnabled = validationComplete && savedDeviceId;
      setIsEnabled(isChatEnabled);
    };

    // Check immediately
    checkStorage();

    // Check every 1 second for changes
    const interval = setInterval(checkStorage, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading, statusMessage]);

  useEffect(() => {
    return () => {
      if (sseClient) {
        sseClient.disconnect();
      }
    };
  }, [sseClient]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getProgressFromStage = (stage) => {
    const stageMap = {
      'processing': 20,
      'transcribing': 40,
      'analyzing': 60,
      'generating': 80,
      'complete': 100,
    };
    return stageMap[stage?.toLowerCase()] || 10;
  };

  const addMessage = (message) => {
    const newMessage = { id: Date.now() + Math.random(), ...message };
    // Auto-play first assistant audio message
    if (message.type === 'audio' && message.sender === 'assistant') {
      newMessage.autoPlay = true;
    }
    setMessages((prev) => [...prev, newMessage]);
  };

  const appendResultMessages = async (resultData) => {
    if (!resultData) return;
    
    if (!resultData.success) {
      addMessage({ type: 'text', sender: 'assistant', text: `Error: ${resultData.error || 'Unknown error'}` });
      return;
    }

    const data = resultData.data;
    if (!data) return;

    if (data.id) {
      setCurrentChatId(data.id);
    }

    const result = data.result;
    if (!result) return;

    if (result.message) {
      addMessage({ type: 'text', sender: 'assistant', text: result.message });
    }

    if (result.media && Array.isArray(result.media)) {
      for (const item of result.media) {
        if (item.url && item.mime_type) {
          try {
            const mediaUrl = await getMediaFile(item.url);
            
            if (item.mime_type.startsWith('audio/')) {
              addMessage({ type: 'audio', sender: 'assistant', audioUrl: mediaUrl });
            } else if (item.mime_type.startsWith('image/')) {
              addMessage({ type: 'image', sender: 'assistant', imageUrl: mediaUrl, filename: item.filename });
            } else if (item.mime_type.startsWith('video/')) {
              addMessage({ type: 'video', sender: 'assistant', videoUrl: mediaUrl, filename: item.filename });
            }
          } catch (error) {
            console.error('Failed to load media:', error);
            addMessage({ type: 'text', sender: 'assistant', text: `Failed to load media: ${item.filename}` });
          }
        }
      }
    }
  };


  const createNewSession = async (audioBlob) => {
    if (!fitterId || !deviceId) {
      alert('Please provide fitter ID and device ID before submitting audio.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    setProgress(0);
    
    try {
      const client = await submitAudioChat({
        audioBlob,
        fitterId,
        deviceId,
        onStatus: (data) => {
          setStatusMessage(data.message || `${data.stage}...`);
          setProgress(getProgressFromStage(data.stage));
        },
        onResult: async (data) => {
          setProgress(100);
          if (data.success && data.data?.id) {
            setCurrentChatId(data.data.id);
          }
          await appendResultMessages(data);
        },
        onError: (data) => {
          addMessage({ type: 'text', sender: 'assistant', text: `Error: ${data.error || 'Unknown error'}` });
        },
        onDone: () => {
          setIsLoading(false);
          setStatusMessage('');
          setProgress(0);
        },
      });
      
      setSseClient(client);
    } catch (error) {
      console.error('Submit audio chat failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error: ${error.message}` });
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const sendContinueChat = async (audioBlob) => {
    if (!currentChatId) {
      return createNewSession(audioBlob);
    }

    setIsLoading(true);
    setStatusMessage('');
    setProgress(0);
    
    try {
      const client = await continueChat({
        id: currentChatId,
        audioBlob,
        onStatus: (data) => {
          setStatusMessage(data.message || `${data.stage}...`);
          setProgress(getProgressFromStage(data.stage));
        },
        onResult: async (data) => {
          setProgress(100);
          await appendResultMessages(data);
        },
        onError: (data) => {
          addMessage({ type: 'text', sender: 'assistant', text: `Error: ${data.error || 'Unknown error'}` });
        },
        onDone: () => {
          setIsLoading(false);
          setStatusMessage('');
          setProgress(0);
        },
      });
      
      setSseClient(client);
    } catch (error) {
      console.error('Continue chat failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error: ${error.message}` });
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleAudioCaptured = async (audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    addMessage({ type: 'audio', sender: 'user', audioUrl });
    await sendContinueChat(audioBlob);
  };

  const startRecording = async () => {
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
          handleAudioCaptured(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.current.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic Error:', err);
      alert('Microphone capture failed.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };





  const handleStartGps = async () => {
    if (!fitterId || !deviceId) {
      alert('Please provide fitter ID and device ID to start GPS action.');
      return;
    }

    setIsLoading(true);
    setGpsClicked(true);
    setStatusMessage('');
    setProgress(0);
    
    try {
      const client = await startGpsAction({
        fitterId,
        deviceId,
        onStatus: (data) => {
          setStatusMessage(data.message || `${data.stage}...`);
          setProgress(getProgressFromStage(data.stage));
        },
        onResult: async (data) => {
          setProgress(100);
          if (data.success && data.data?.id) {
            setCurrentChatId(data.data.id);
          }
          await appendResultMessages(data);
        },
        onError: (data) => {
          addMessage({ type: 'text', sender: 'assistant', text: `Error: ${data.error || 'Unknown error'}` });
        },
        onDone: () => {
          setIsLoading(false);
          setStatusMessage('');
          setProgress(0);
        },
      });
      
      setSseClient(client);
    } catch (error) {
      console.error('GPS action failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error: ${error.message}` });
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    setCurrentChatId(null);
    setGpsClicked(false);
    if (sseClient) {
      sseClient.disconnect();
    }
  };

  return (
    <>
      {!isOpen && isEnabled && (
        <button onClick={() => setIsOpen(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-white text-[#2D4356] rounded-full shadow-2xl flex items-center justify-center z-[200] border border-gray-100 active:scale-95 transition-all">
          <MessageCircle size={28} />
        </button>
      )}

      {!isOpen && !isEnabled && (
        <button disabled className="absolute bottom-6 right-6 w-14 h-14 bg-gray-300 text-gray-500 rounded-full shadow-2xl flex items-center justify-center z-[200] border border-gray-200 cursor-not-allowed">
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="absolute inset-0 bg-[#F9F9F7] z-[300] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-white border-b border-gray-200 px-4 py-4 pt-8 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-[#2D4356]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2D4356]">Voice Assistant</span>
              </div>
              <X size={20} className="cursor-pointer text-gray-400" onClick={() => setIsOpen(false)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={fitterId}
                readOnly
                placeholder="Fitter ID"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
              />
              <input
                value={deviceId}
                readOnly
                placeholder="Device ID"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender === 'user' ? 'bg-[#2D4356] text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                  {message.type === 'text' && <p className="text-sm">{message.text}</p>}
                  {message.type === 'audio' && <AudioPlayer url={message.audioUrl} isUser={message.sender === 'user'} autoPlay={message.autoPlay || false} />}
                  {message.type === 'image' && <img src={message.imageUrl} alt={message.filename} className="max-w-full rounded-lg" />}
                  {message.type === 'video' && (
                    <video
                      src={message.videoUrl}
                      controls
                      className="max-w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-center gap-3 px-4 py-3">
                <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2D4356] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {statusMessage && (
                  <p className="text-xs text-gray-500 text-center">{statusMessage}</p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 pb-10">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!deviceId || !fitterId || isLoading}
                  className={`col-span-1 rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-[#2D4356] text-white'} ${(!deviceId || !fitterId || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Mic size={16} />
                    {isRecording ? 'Stop Recording' : 'Record Audio'}
                  </span>
                </button>
                <button
                  onClick={handleStartGps}
                  disabled={isRecording || !!currentChatId || !deviceId || !fitterId || isLoading || gpsClicked}
                  className={`col-span-1 rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all bg-white text-[#2D4356] border border-gray-200 ${isRecording || !!currentChatId || !deviceId || !fitterId || isLoading || gpsClicked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <MapPin size={16} />
                    Check GPS
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AudioPlayer({ url, isUser, autoPlay = false }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef(new Audio(url));

  useEffect(() => {
    const a = audio.current;
    a.onended = () => setPlaying(false);
    if (autoPlay) {
      a.play();
      setPlaying(true);
    }
    return () => a.pause();
  }, [url, autoPlay]);

  const toggle = () => {
    if (playing) audio.current.pause();
    else audio.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 min-w-[150px] py-1">
      <button onClick={toggle} className={isUser ? 'text-white' : 'text-[#2D4356]'}>
        {playing ? <Pause size={20} fill='currentColor' /> : <Play size={20} fill='currentColor' />}
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
