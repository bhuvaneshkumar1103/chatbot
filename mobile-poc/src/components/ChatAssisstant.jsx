import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, Bot, Loader2, Play, Pause, MapPin } from 'lucide-react';
import { submitAudioChat, continueChat, getChatSession, getTaskResult, startGpsAction } from '../api/chatbot';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fitterId, setFitterId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [gpsClicked, setGpsClicked] = useState(false);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [lastResponseId, setLastResponseId] = useState(null);
  const [answeringQuestion, setAnsweringQuestion] = useState(false);

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
  }, [messages, isLoading, isPolling]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const addMessage = (message) => {
    const newMessage = { id: Date.now() + Math.random(), ...message };
    // Auto-play first assistant audio message
    if (message.type === 'audio' && message.sender === 'assistant') {
      newMessage.autoPlay = true;
    }
    setMessages((prev) => [...prev, newMessage]);
  };

  const appendResultMessages = (resultData) => {
    if (!resultData) return;
    const messagesToAdd = [];
    
    // Extract ID from response data first - available for all responses
    if (resultData.data?.id) {
      setLastResponseId(resultData.data.id);
    }
    
    // Navigate through nested response structure
    // Could be: resultData.result.result or resultData.result or resultData
    let result = resultData;
    if (resultData.data.result) {
      result = resultData.data.result;
      if (result.result) {
        result = result.result;
      }
    }
    
    // Handle error messages
    if (resultData.error) {
      addMessage({ type: 'text', sender: 'assistant', text: `Error: ${resultData.error}` });
      return;
    }

    // Store the action for later use in answer
      if (result.action) {
        setLastAction(result.action);
      }

    // Handle question type responses
    if (result.type === 'question') {
      setLastQuestion(result);
    
      if (result.message) {
        messagesToAdd.push({ type: 'text', sender: 'assistant', text: result.message, isQuestion: true });
      }
    } else {
      // Regular response handling
      if (result.message) {
        messagesToAdd.push({ type: 'text', sender: 'assistant', text: result.message });
      }
      if (result.sms_result) {
        messagesToAdd.push({ type: 'text', sender: 'assistant', text: result.sms_result });
      }
      if (result.session_id) {
        messagesToAdd.push({ type: 'text', sender: 'assistant', text: `Session ID: ${result.session_id}` });
      }
    }
    
    // Handle media (images, videos, audio)
    if (result.media && Array.isArray(result.media)) {
      result.media.forEach((item) => {
        if (item.data && item.mime_type && item.encoding === 'base64') {
          const dataUrl = `data:${item.mime_type};base64,${item.data}`;
          if (item.mime_type.startsWith('audio/')) {
            messagesToAdd.push({ type: 'audio', sender: 'assistant', audioUrl: dataUrl });
          } else if (item.mime_type.startsWith('image/')) {
            messagesToAdd.push({ type: 'image', sender: 'assistant', imageUrl: dataUrl, filename: item.filename });
          } else if (item.mime_type.startsWith('video/')) {
            messagesToAdd.push({ type: 'video', sender: 'assistant', videoUrl: dataUrl, filename: item.filename });
          }
        }
      });
    }
    
    // If nothing was extracted, show the raw data as fallback
    if (messagesToAdd.length === 0) {
      addMessage({ type: 'text', sender: 'assistant', text: JSON.stringify(resultData, null, 2) });
      return;
    }
    
    messagesToAdd.forEach((msg) => addMessage(msg));
  };

  const pollTaskResult = async (taskIdToPoll) => {
    if (!taskIdToPoll) return;
    setIsPolling(true);
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await getTaskResult(taskIdToPoll);
        if (!response) break;
        if (response.success) {
          const payload = response.data;
          const status = payload?.status || payload?.result?.status;
          if (status && status !== 'pending') {
            appendResultMessages(payload);
            return payload;
          }
        }
        await sleep(2500);
      }
    } catch (error) {
      console.error('Polling error:', error);
      addMessage({ type: 'text', sender: 'assistant', text: 'Failed to poll task result.' });
    } finally {
      setIsPolling(false);
    }
  };

  const createNewSession = async (audioBlob) => {
    if (!fitterId || !deviceId) {
      alert('Please provide fitter ID and device ID before submitting audio.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await submitAudioChat({ audioBlob, fitterId, deviceId });
      if (response.success) {
        const id = response.data?.id;
        // const pollUrl = response.data?.poll_url;
        setSessionId(id);
        // if (pollUrl) {
        //   const taskIdValue = pollUrl.split('/').pop();
        //   setTaskId(taskIdValue);
        //   await pollTaskResult(taskIdValue);
        // }
        appendResultMessages(response);
        return response;
      }
      addMessage({ type: 'text', sender: 'assistant', text: response.error || 'Failed to submit audio chat.' });
    } catch (error) {
      console.error('Submit audio chat failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error submitting audio chat: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const sendContinueChat = async (audioBlob, answer = null) => {
    // If we're answering a question, we must have a sessionId
    if (answer && !sessionId) {
      alert('Error: No active session for answering.');
      return;
    }
    
    // If we don't have session or audio, create new session (only for initial audio)
    if (!sessionId && audioBlob && !lastResponseId) {
      return createNewSession(audioBlob);
    }

    
    // If we have no session and no audio, that's an error
    // if (!sessionId) {
    //   alert('No active session. Please record audio to start.');
    //   return;
    // }

    setIsLoading(true);
    try {
      // Determine if we need to send answer_text
      // For default_question_asked action, we send answer_text (yes/no)
      // For other actions, answer_text is null
      const params = { id: lastResponseId, audioBlob };
      
      if (lastAction) {
        params.action = lastAction;
        // Only send answer_text for question type actions with answer
        if (lastQuestion && answer) {
          params.answerText = answer;
        }
      }
      
      const response = await continueChat(params);
      if (response.success) {
        appendResultMessages(response);
        // setLastQuestion(null);
        // setLastAction(null);
        return response;
      }
      addMessage({ type: 'text', sender: 'assistant', text: response.error || 'Failed to continue chat.' });
    } catch (error) {
      console.error('Continue chat failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error continuing chat: ${error.message}` });
    } finally {
      setIsLoading(false);
      setAnsweringQuestion(false);
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

  const handlePollSession = async () => {
    if (!sessionId) {
      alert('No session ID found. Start a chat first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await getChatSession(sessionId);
      if (response.success) {
        appendResultMessages(response.data);
      } else {
        addMessage({ type: 'text', sender: 'assistant', text: response.error || 'Failed to poll chat session.' });
      }
    } catch (error) {
      console.error('Poll session failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: 'Network error polling session.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGps = async () => {
    if (!fitterId || !deviceId) {
      alert('Please provide fitter ID and device ID to start GPS action.');
      return;
    }

    setIsLoading(true);
    setGpsClicked(true);
    try {
      const response = await startGpsAction({ fitterId, deviceId });
      if (response.success) {
        appendResultMessages(response);
      } else {
        addMessage({ type: 'text', sender: 'assistant', text: response.error || 'Failed to start GPS action.' });
      }
    } catch (error) {
      console.error('GPS action failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: 'Network error starting GPS action.' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuestionAnswer = async (id, answerValue, audioBlob) => {
    setIsLoading(true);
    try {
      const params = { id, audioBlob };
      
      if (lastAction) {
        params.action = lastAction;
      }
      
      // Send answer_text for question type responses
      if (answerValue) {
        params.answerText = answerValue;
      }
      
      const response = await continueChat(params);
      if (response.success) {
        appendResultMessages(response);
        // setLastQuestion(response.data?.result?.action);
        // setLastAction(response.data?.result?.action || null); // Update lastAction if it changed with the answer
        setLastResponseId(response.data?.id); // Update lastResponseId in case it changed with the answer
        return response;
      }
      addMessage({ type: 'text', sender: 'assistant', text: response.error || 'Failed to answer question.' });
    } catch (error) {
      console.error('Question answer failed:', error);
      addMessage({ type: 'text', sender: 'assistant', text: `Network error answering question: ${error.message}` });
    } finally {
      setIsLoading(false);
      setAnsweringQuestion(false);
    }
  };

  const handleQuestionAnswer = async (answerValue) => {
    const responseId = lastResponseId || sessionId;
    if (!responseId) {
      alert('No ID available to answer question.');
      return;
    }
    
    setAnsweringQuestion(true);
    if (answerValue === 'no') {
      // Auto-start recording for 'no' answer
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
            addMessage({ type: 'audio', sender: 'user', audioUrl });
            // Send with answerValue for question type
            sendQuestionAnswer(responseId, answerValue, audioBlob);
          }
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.current.start(1000);
        setIsRecording(true);
        // Auto-stop after 8 seconds
        setTimeout(() => {
          if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
          }
        }, 8000);
      } catch (err) {
        console.error('Mic Error:', err);
        alert('Microphone capture failed.');
        setAnsweringQuestion(false);
      }
    } else if (answerValue === 'yes') {
      // For 'yes', send without audio
      await sendQuestionAnswer(responseId, answerValue, null);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    setTaskId(null);
    setGpsClicked(false);
    setLastQuestion(null);
    setLastAction(null);
    setLastResponseId(null);
    setAnsweringQuestion(false);
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
                  {message.type === 'text' && (
                    <>
                      <p className="text-sm">{message.text}</p>
                      {message.isQuestion && lastQuestion && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleQuestionAnswer('yes')}
                            disabled={isLoading || answeringQuestion}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg text-xs transition-all"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleQuestionAnswer('no')}
                            disabled={isLoading || answeringQuestion}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg text-xs transition-all"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </>
                  )}
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
            {(isLoading || isPolling) && <Loader2 className="animate-spin text-gray-300 mx-auto" size={18} />}
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
                  disabled={isRecording || !!sessionId || !deviceId || !fitterId || isLoading || gpsClicked}
                  className={`col-span-1 rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all bg-white text-[#2D4356] border border-gray-200 ${isRecording || !!sessionId || !deviceId || !fitterId || isLoading || gpsClicked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
