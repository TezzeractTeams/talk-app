import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Play, Pause, Square, Trash2, Send, X } from "lucide-react";
import { 
  getMicrophonePermission, 
  convertBlobToFile, 
  formatDuration, 
  drawWaveform,
  createAudioAnalyser,
  getAudioLevel,
  createMediaRecorder
} from "../lib/audioUtils";
import toast from "react-hot-toast";

const AudioRecorder = ({ onSend, onCancel, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  
  // Use refs to track recording state for animation
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const chunksRef = useRef([]);

  // Request microphone permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      const result = await getMicrophonePermission();
      if (result.success) {
        setHasPermission(true);
        streamRef.current = result.stream;
      } else {
        setHasPermission(false);
        setError(result.error);
      }
    };
    requestPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      toast.error("No microphone access");
      return;
    }

    try {
      console.log('Starting recording with stream:', streamRef.current);
      
      const mediaRecorder = createMediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      console.log('MediaRecorder created:', mediaRecorder);
      console.log('MediaRecorder state:', mediaRecorder.state);
      console.log('MediaRecorder mimeType:', mediaRecorder.mimeType);

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunksRef.current.length);
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        toast.error('Recording failed. Please try again.');
        setIsRecording(false);
        setIsPaused(false);
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };

      // Set recording state immediately
      setIsRecording(true);
      setIsPaused(false);
      isRecordingRef.current = true;
      isPausedRef.current = false;
      startTimeRef.current = Date.now();
      
      // Start recording with a longer interval to ensure data is captured
      mediaRecorder.start(1000); // Collect data every 1 second
      
      // Start waveform animation immediately
      startWaveformAnimation();

    } catch (error) {
      console.error('Recording error:', error);
      if (error.name === 'NotSupportedError') {
        toast.error('Audio recording not supported in this browser. Please try a different browser.');
      } else {
        toast.error('Failed to start recording. Please check your microphone permissions.');
      }
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
      startWaveformAnimation();
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      isRecordingRef.current = false;
      isPausedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, []);

  // Start waveform animation
  const startWaveformAnimation = useCallback(() => {
    if (!streamRef.current || !canvasRef.current) return;

    console.log('Starting waveform animation');
    const { analyser } = createAudioAnalyser(streamRef.current);
    const canvas = canvasRef.current;

    const animate = () => {
      // Check if we should continue animating using refs
      if (!isRecordingRef.current || isPausedRef.current) {
        console.log('Animation stopped - recording:', isRecordingRef.current, 'paused:', isPausedRef.current);
        return;
      }

      const audioData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(audioData);
      
      drawWaveform(canvas, audioData, canvas.width, canvas.height, '#3b82f6');
      
      // Update duration
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []); // Remove dependencies to prevent re-creation

  // Play/pause audio preview
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Send audio
  const handleSend = useCallback(() => {
    if (audioBlob && onSend) {
      const file = convertBlobToFile(audioBlob, `voice-message-${Date.now()}.webm`);
      onSend(file);
      onClose?.();
    }
  }, [audioBlob, onSend, onClose]);

  // Cancel recording
  const handleCancel = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    onCancel?.();
  }, [isRecording, stopRecording, onCancel]);

  // Delete recorded audio
  const handleDelete = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  }, [audioUrl]);

  if (hasPermission === false) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <MicOff className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Microphone Access Required</h3>
        <p className="text-neutral-400 mb-4">{error}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-neutral-700 text-neutral-100 rounded-lg hover:bg-neutral-600 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center animate-pulse">
          <Mic className="w-8 h-8 text-neutral-600" />
        </div>
        <p className="text-neutral-400">Requesting microphone access...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">Voice Message</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Waveform Canvas */}
      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={300}
          height={80}
          className="w-full h-20 bg-neutral-800 rounded-lg"
        />
      </div>

      {/* Duration Display */}
      <div className="text-center mb-4">
        <span className="text-2xl font-mono text-neutral-100">
          {formatDuration(duration)}
        </span>
        {isRecording && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-400">Recording...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {!audioBlob ? (
          // Recording controls
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Mic className="w-6 h-6 text-white" />
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={pauseRecording}
                    className="w-12 h-12 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Pause className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="w-12 h-12 bg-neutral-600 hover:bg-neutral-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Square className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </>
        ) : (
          // Playback controls
          <>
            <button
              onClick={togglePlayback}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {audioBlob && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-neutral-700 text-neutral-100 rounded-lg hover:bg-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default AudioRecorder;
