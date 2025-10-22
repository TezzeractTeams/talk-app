import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip, File, Reply, Camera, Video, Mic } from "lucide-react";
import toast from "react-hot-toast";
import MobileFilePreview from "./MobileFilePreview";

const MessageInput = ({ selectedChat }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  
  const { sendChatMessage, replyingTo, clearReplyingTo } = useChatStore();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File must be less than 100MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        data: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Mobile-specific handlers
  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be less than 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        data: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAudioCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Audio must be less than 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        data: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Web Share API for mobile
  const handleWebShare = async (file) => {
    if (navigator.share && navigator.canShare) {
      try {
        const shareData = {
          title: 'Share file',
          text: `Check out this file: ${file.name}`,
          files: [file]
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback to regular file handling
          handleFileChange({ target: { files: [file] } });
        }
      } catch (error) {
        console.log('Web Share failed, using fallback:', error);
        handleFileChange({ target: { files: [file] } });
      }
    } else {
      handleFileChange({ target: { files: [file] } });
    }
  };

  // Drag and drop for mobile
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        handleImageChange({ target: { files: [file] } });
      } else {
        handleFileChange({ target: { files: [file] } });
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview) return;
    if (!selectedChat) return;

    try {
      const messageData = {
        text: text.trim(),
        ...(imagePreview && { image: imagePreview }),
        ...(filePreview && {
          file: filePreview.data,
          fileName: filePreview.name,
          fileType: filePreview.type,
        }),
      };

      await sendChatMessage(selectedChat._id, selectedChat.type === 'group', messageData);

      setText("");
      setImagePreview(null);
      setFilePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="border-t border-neutral-800 p-2 md:p-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 flex items-start gap-1.5 md:gap-2 p-1.5 md:p-2 bg-neutral-800/50 rounded-lg border-l-4 border-blue-500">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Reply className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-xs font-semibold text-blue-400 truncate">
                {replyingTo.senderId?.fullName || "Unknown"}
              </span>
            </div>
            
            {/* Show image thumbnail if replying to image */}
            {replyingTo.image && (
              <img
                src={replyingTo.image}
                alt="Reply preview"
                className="max-w-[80px] md:max-w-[100px] max-h-[50px] md:max-h-[60px] rounded mb-1 object-cover"
              />
            )}
            
            {/* Show file info if replying to file */}
            {replyingTo.file && (
              <div className="flex items-center gap-1 mb-1">
                <File size={12} className="text-neutral-400 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="text-xs text-neutral-400 truncate">{replyingTo.file.name}</span>
              </div>
            )}
            
            {/* Show text with line clamp */}
            {replyingTo.text && (
              <p className="text-xs text-neutral-400 line-clamp-2">
                {replyingTo.text}
              </p>
            )}
          </div>
          <button
            onClick={clearReplyingTo}
            className="p-1 rounded-full hover:bg-neutral-700 active:bg-neutral-700 transition-colors shrink-0"
            type="button"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-400" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 md:mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-neutral-600"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors shadow-md"
              type="button"
            >
              <X className="w-3.5 h-3.5 text-neutral-100" />
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-2 md:mb-3">
          {isMobile ? (
            <MobileFilePreview
              file={filePreview}
              onRemove={removeFile}
              onDownload={(file) => {
                const link = document.createElement('a');
                link.href = file.data;
                link.download = file.name;
                link.click();
              }}
            />
          ) : (
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-neutral-800 rounded-lg border border-neutral-600">
              <div className="p-2 bg-neutral-700 rounded-lg">
                <File size={24} className="text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-neutral-100">
                  {filePreview.name}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatFileSize(filePreview.size)}
                </p>
              </div>
              <button
                onClick={removeFile}
                className="w-6 h-6 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <form 
        onSubmit={handleSendMessage} 
        className="flex items-center gap-1 md:gap-2"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex-1 flex gap-1 md:gap-2">
          <input
            type="text"
            className="flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-neutral-600 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent text-sm transition-all"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            accept="*/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {/* Mobile-specific camera inputs */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleCameraCapture}
          />
          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            ref={videoInputRef}
            onChange={handleVideoCapture}
          />
          <input
            type="file"
            accept="audio/*"
            capture="microphone"
            className="hidden"
            ref={audioInputRef}
            onChange={handleAudioCapture}
          />

          {/* Desktop Upload Buttons */}
          <button
            type="button"
            className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center transition-all ${
              imagePreview
                ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="w-5 h-5" />
          </button>

          <button
            type="button"
            className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center transition-all ${
              filePreview
                ? "bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700/30"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Mobile Upload Button */}
          {isMobile && (
            <button
              type="button"
              className="sm:hidden w-10 h-10 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 flex items-center justify-center transition-all"
              onClick={() => setShowMobileOptions(!showMobileOptions)}
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            !text.trim() && !imagePreview && !filePreview
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-neutral-600 hover:bg-neutral-700 text-neutral-100 shadow-sm hover:shadow-md"
          }`}
          disabled={!text.trim() && !imagePreview && !filePreview}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Mobile File Options Modal */}
      {isMobile && showMobileOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-neutral-900 rounded-t-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-100">Share File</h3>
              <button
                onClick={() => setShowMobileOptions(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Camera Photo */}
              <button
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowMobileOptions(false);
                }}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Camera className="w-8 h-8 text-green-400 mb-2" />
                <span className="text-sm text-neutral-100">Camera</span>
              </button>

              {/* Gallery Photo */}
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowMobileOptions(false);
                }}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Image className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm text-neutral-100">Gallery</span>
              </button>

              {/* Video */}
              <button
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowMobileOptions(false);
                }}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Video className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-sm text-neutral-100">Video</span>
              </button>

              {/* Audio */}
              <button
                onClick={() => {
                  audioInputRef.current?.click();
                  setShowMobileOptions(false);
                }}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Mic className="w-8 h-8 text-pink-400 mb-2" />
                <span className="text-sm text-neutral-100">Audio</span>
              </button>

              {/* Files */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMobileOptions(false);
                }}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <File className="w-8 h-8 text-orange-400 mb-2" />
                <span className="text-sm text-neutral-100">Files</span>
              </button>

              {/* Web Share (if supported) */}
              {navigator.share && (
                <button
                  onClick={() => {
                    // Trigger file picker for web share
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '*/*';
                    input.onchange = (e) => {
                      if (e.target.files[0]) {
                        handleWebShare(e.target.files[0]);
                      }
                    };
                    input.click();
                    setShowMobileOptions(false);
                  }}
                  className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <Paperclip className="w-8 h-8 text-cyan-400 mb-2" />
                  <span className="text-sm text-neutral-100">Share</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;