// Audio recording and playback utilities

export const getMicrophonePermission = async () => {
  // Check if MediaRecorder is supported
  if (!window.MediaRecorder) {
    return {
      success: false,
      error: 'Audio recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.'
    };
  }

  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      success: false,
      error: 'Microphone access is not supported in this browser. Please use a modern browser.'
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      } 
    });
    return { success: true, stream };
  } catch (error) {
    console.error('Microphone permission error:', error);
    return { 
      success: false, 
      error: error.name === 'NotAllowedError' 
        ? 'Microphone access denied. Please allow microphone access to record audio.'
        : error.name === 'NotFoundError'
        ? 'No microphone found. Please connect a microphone and try again.'
        : 'Failed to access microphone. Please check your microphone settings.'
    };
  }
};

export const convertBlobToFile = (blob, filename = 'audio-recording.webm') => {
  // Determine file extension based on MIME type
  let extension = 'webm';
  if (blob.type.includes('mp4')) {
    extension = 'mp4';
  } else if (blob.type.includes('wav')) {
    extension = 'wav';
  }
  
  const finalFilename = filename.endsWith(extension) ? filename : `audio-recording.${extension}`;
  
  return new File([blob], finalFilename, { 
    type: blob.type || 'audio/webm',
    lastModified: Date.now()
  });
};

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getAudioDuration = (audioBlob) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
};

export const drawWaveform = (canvas, audioData, width, height, color = '#3b82f6') => {
  const ctx = canvas.getContext('2d');
  const barWidth = 2;
  const barGap = 1;
  const maxBars = Math.floor(width / (barWidth + barGap));
  
  // Clear canvas
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, width, height);
  
  if (!audioData || audioData.length === 0) return;
  
  // Normalize and draw bars
  const step = Math.floor(audioData.length / maxBars);
  ctx.fillStyle = color;
  
  for (let i = 0; i < maxBars; i++) {
    const dataIndex = i * step;
    const amplitude = Math.abs(audioData[dataIndex]) || 0;
    const barHeight = Math.max(2, (amplitude * height) / 2);
    
    const x = i * (barWidth + barGap);
    const y = (height - barHeight) / 2;
    
    ctx.fillRect(x, y, barWidth, barHeight);
  }
};

export const createAudioAnalyser = (stream) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  
  return { audioContext, analyser };
};

export const getAudioLevel = (analyser) => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average amplitude
  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  return sum / dataArray.length / 255; // Normalize to 0-1
};

export const createMediaRecorder = (stream, options = {}) => {
  // Try different MIME types in order of preference
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav'
  ];
  
  let selectedMimeType = null;
  let selectedOptions = { audioBitsPerSecond: 128000 };
  
  // Find the first supported MIME type
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      selectedMimeType = mimeType;
      break;
    }
  }
  
  // If no specific MIME type is supported, use default
  if (!selectedMimeType) {
    console.warn('No preferred audio format supported, using browser default');
    return new MediaRecorder(stream);
  }
  
  console.log(`Using audio format: ${selectedMimeType}`);
  return new MediaRecorder(stream, {
    mimeType: selectedMimeType,
    ...selectedOptions,
    ...options
  });
};

export const downloadAudioFile = (audioBlob, filename = 'audio-recording.webm') => {
  const url = URL.createObjectURL(audioBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateAudioFile = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Audio file is too large. Maximum size is 50MB.' };
  }
  
  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    return { valid: false, error: 'Unsupported audio format.' };
  }
  
  return { valid: true };
};
