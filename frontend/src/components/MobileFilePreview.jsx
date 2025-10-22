import { useState } from "react";
import { X, Download, Eye, Play, Pause, Volume2, VolumeX } from "lucide-react";
import FileIcon from "./FileIcon";

const MobileFilePreview = ({ file, onRemove, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isVideo = file.type?.startsWith('video/');
  const isAudio = file.type?.startsWith('audio/');
  const isImage = file.type?.startsWith('image/');

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-600 p-3 mb-3">
      <div className="flex items-start gap-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {isImage ? (
            <img
              src={file.data || file.url}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-neutral-700 rounded-lg flex items-center justify-center">
              <FileIcon 
                fileType={file.type} 
                extension={getFileExtension(file.name)} 
                size={24} 
              />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-100 truncate">
            {file.name}
          </h4>
          <p className="text-xs text-neutral-400 mb-2">
            {formatFileSize(file.size)}
          </p>

          {/* Media Controls for Audio/Video */}
          {(isVideo || isAudio) && (
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-neutral-100" />
                ) : (
                  <Play className="w-4 h-4 text-neutral-100" />
                )}
              </button>
              
              {isAudio && (
                <button
                  onClick={handleMuteToggle}
                  className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-neutral-100" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-neutral-100" />
                  )}
                </button>
              )}

              <div className="flex-1 bg-neutral-600 rounded-full h-1">
                <div className="bg-neutral-100 rounded-full h-1 w-1/3"></div>
              </div>
            </div>
          )}

          {/* File Type Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-neutral-700 text-neutral-300 rounded">
              {getFileExtension(file.name).toUpperCase() || 'FILE'}
            </span>
            {file.type && (
              <span className="text-xs text-neutral-500">
                {file.type.split('/')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {onDownload && (
            <button
              onClick={() => onDownload(file)}
              className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-neutral-100" />
            </button>
          )}
          
          <button
            onClick={() => window.open(file.data || file.url, '_blank')}
            className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4 text-neutral-100" />
          </button>

          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-red-900/20 hover:bg-red-900/30 flex items-center justify-center transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Mobile-specific features */}
      <div className="mt-3 pt-3 border-t border-neutral-700">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Mobile optimized</span>
          <div className="flex items-center gap-2">
            {isVideo && <span>📹 Video</span>}
            {isAudio && <span>🎵 Audio</span>}
            {isImage && <span>🖼️ Image</span>}
            {!isVideo && !isAudio && !isImage && <span>📄 File</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilePreview;
