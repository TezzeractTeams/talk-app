import { useState, useRef } from "react";
import { Camera, Video, Mic, File, Image, Share, X } from "lucide-react";
import AudioRecorder from "./AudioRecorder";

const MobileFileShare = ({ onFileSelect, onClose }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleFileInput = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = (e) => {
          if (e.target.files[0]) {
            navigator.share({
              title: 'Share file',
              text: `Check out this file: ${e.target.files[0].name}`,
              files: [e.target.files[0]]
            }).then(() => {
              onClose();
            }).catch((error) => {
              console.log('Web Share failed:', error);
              // Fallback to regular file handling
              onFileSelect(e.target.files[0]);
            });
          }
          setIsSharing(false);
        };
        input.click();
      } catch (error) {
        console.log('Web Share error:', error);
        setIsSharing(false);
      }
    }
  };

  const shareOptions = [
    {
      icon: Camera,
      label: "Camera",
      color: "text-green-400",
      bg: "bg-green-900/20",
      onClick: () => handleFileInput(cameraInputRef),
      input: (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />
      )
    },
    {
      icon: Image,
      label: "Gallery",
      color: "text-blue-400",
      bg: "bg-blue-900/20",
      onClick: () => handleFileInput(imageInputRef),
      input: (
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />
      )
    },
    {
      icon: Video,
      label: "Video",
      color: "text-purple-400",
      bg: "bg-purple-900/20",
      onClick: () => handleFileInput(videoInputRef),
      input: (
        <input
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          ref={videoInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />
      )
    },
    {
      icon: Mic,
      label: "Audio",
      color: "text-pink-400",
      bg: "bg-pink-900/20",
      onClick: () => setShowAudioRecorder(true),
      input: null
    },
    {
      icon: File,
      label: "Files",
      color: "text-orange-400",
      bg: "bg-orange-900/20",
      onClick: () => handleFileInput(fileInputRef),
      input: (
        <input
          type="file"
          accept="*/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />
      )
    }
  ];

  // Add Web Share option if supported
  if (navigator.share) {
    shareOptions.push({
      icon: Share,
      label: "Share",
      color: "text-cyan-400",
      bg: "bg-cyan-900/20",
      onClick: handleWebShare,
      input: null
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-neutral-900 rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">Share File</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {shareOptions.map((option, index) => (
            <div key={index}>
              <button
                onClick={option.onClick}
                disabled={isSharing}
                className={`w-full flex flex-col items-center p-4 rounded-lg transition-colors ${
                  option.bg
                } hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option.icon className={`w-8 h-8 ${option.color} mb-2`} />
                <span className="text-sm text-neutral-100 font-medium">
                  {option.label}
                </span>
              </button>
              {option.input}
            </div>
          ))}
        </div>

        {/* Additional mobile-specific features */}
        <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
          <h4 className="text-sm font-medium text-neutral-200 mb-2">Mobile Features</h4>
          <div className="text-xs text-neutral-400 space-y-1">
            <p>• Camera: Take photos directly</p>
            <p>• Video: Record videos with camera</p>
            <p>• Audio: Record voice messages</p>
            <p>• Drag & drop files from other apps</p>
            {navigator.share && <p>• Native sharing with other apps</p>}
          </div>
        </div>
      </div>

      {/* Audio Recorder Modal */}
      {showAudioRecorder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 rounded-xl border border-neutral-700">
            <AudioRecorder
              onSend={(audioFile) => {
                onFileSelect(audioFile);
                setShowAudioRecorder(false);
                onClose();
              }}
              onCancel={() => setShowAudioRecorder(false)}
              onClose={() => setShowAudioRecorder(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFileShare;
