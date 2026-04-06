const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1/chatbot";

async function submitAudioChat({ audioBlob, fitterId, deviceId }) {
  const formData = new FormData();
  if (audioBlob) formData.append("audio", audioBlob, "audio.wav");
  formData.append("fitter_id", fitterId);
  formData.append("device_id", deviceId);

  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    mode: "cors",
    body: formData,
  });

  return response.json();
}

async function continueChat({ id, audioBlob, action, answerText }) {
  const formData = new FormData();
  if (audioBlob) formData.append("audio", audioBlob, "audio.wav");
  if (action) formData.append("action", action);
  if (answerText) formData.append("answer_text", answerText);

  const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    mode: "cors",
    body: formData,
  });

  return response.json();
}

async function getChatSession(id) {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "GET",
    mode: "cors",
  });

  return response.json();
}

async function getTaskResult(taskId) {
  const response = await fetch(`${BASE_URL}/result/${encodeURIComponent(taskId)}`, {
    method: "GET",
    mode: "cors",
  });

  return response.json();
}

async function startGpsAction({ fitterId, deviceId }) {
  const formData = new FormData();
  formData.append("fitter_id", fitterId);
  formData.append("device_id", deviceId);

  try {
    const response = await fetch(`${BASE_URL}/action/gps`, {
      method: "POST",
      mode: "cors",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GPS API Error:', error);
    throw error;
  }
}

export { submitAudioChat, continueChat, getChatSession, getTaskResult, startGpsAction };