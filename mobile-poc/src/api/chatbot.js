import SSEClient from '../utils/sseClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

async function submitAudioChat({ audioBlob, fitterId, deviceId, onStatus, onResult, onError, onDone }) {
  const formData = new FormData();
  if (audioBlob) formData.append("audio", audioBlob, "audio.wav");
  formData.append("fitter_id", fitterId);
  formData.append("device_id", deviceId);

  const sseClient = new SSEClient();
  
  await sseClient.connect(`${BASE_URL}/chatbot/`, {
    method: "POST",
    body: formData,
    onStatus: (data) => {
      if (onStatus) onStatus(data);
    },
    onResult: (data) => {
      if (onResult) onResult(data);
    },
    onError: (data) => {
      if (onError) onError(data);
    },
    onDone: () => {
      if (onDone) onDone();
    },
  });

  return sseClient;
}

async function continueChat({ id, audioBlob, onStatus, onResult, onError, onDone }) {
  const formData = new FormData();
  if (audioBlob) formData.append("audio", audioBlob, "audio.wav");

  const sseClient = new SSEClient();
  
  await sseClient.connect(`${BASE_URL}/chatbot/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: formData,
    onStatus: (data) => {
      if (onStatus) onStatus(data);
    },
    onResult: (data) => {
      if (onResult) onResult(data);
    },
    onError: (data) => {
      if (onError) onError(data);
    },
    onDone: () => {
      if (onDone) onDone();
    },
  });

  return sseClient;
}

async function getMediaFile(url) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Media fetch error:', error);
    throw error;
  }
}

async function startGpsAction({ fitterId, deviceId, onStatus, onResult, onError, onDone }) {
  const formData = new FormData();
  formData.append("fitter_id", fitterId);
  formData.append("device_id", deviceId);

  const sseClient = new SSEClient();
  
  await sseClient.connect(`${BASE_URL}/chatbot/action/gps`, {
    method: "POST",
    body: formData,
    onStatus: (data) => {
      if (onStatus) onStatus(data);
    },
    onResult: (data) => {
      if (onResult) onResult(data);
    },
    onError: (data) => {
      if (onError) onError(data);
    },
    onDone: () => {
      if (onDone) onDone();
    },
  });

  return sseClient;
}

export { submitAudioChat, continueChat, getMediaFile, startGpsAction };