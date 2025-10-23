import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { formatDuration } from "../lib/audioUtils";

const AudioMessagePlayer = ({ audioUrl, fileName, isOwnMessage, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Load audio metadata
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Download audio file
  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = fileName || 'audio-message.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-neutral-600' : 'bg-neutral-700'} ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <Volume2 className="w-4 h-4" />
          <span className="text-sm">Failed to load audio</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg ${isOwnMessage ? 'bg-neutral-600' : 'bg-neutral-700'} ${className}`}>
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isPlaying 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-neutral-500 hover:bg-neutral-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Audio Info and Controls */}
        <div className="flex-1 min-w-0">
          {/* File name */}
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-sm text-neutral-300 truncate">
              {fileName || 'Voice Message'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono min-w-0">
              {formatDuration(currentTime)}
            </span>
            
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-2 bg-neutral-600 rounded-full cursor-pointer hover:bg-neutral-500 transition-colors"
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <span className="text-xs text-neutral-400 font-mono">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-8 h-8 rounded-full bg-neutral-600 hover:bg-neutral-500 flex items-center justify-center transition-colors"
          title="Download audio"
        >
          <Download className="w-4 h-4 text-neutral-300" />
        </button>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default AudioMessagePlayer;
