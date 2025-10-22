// Mobile file sharing utilities

export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

export const isWebShareSupported = () => {
  return navigator.share && navigator.canShare;
};

export const getMobileFileTypes = () => {
  return {
    images: {
      accept: 'image/*',
      capture: 'environment',
      maxSize: 10 * 1024 * 1024, // 10MB
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']
    },
    videos: {
      accept: 'video/*',
      capture: 'environment',
      maxSize: 50 * 1024 * 1024, // 50MB
      extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp']
    },
    audio: {
      accept: 'audio/*',
      capture: 'microphone',
      maxSize: 20 * 1024 * 1024, // 20MB
      extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac']
    },
    documents: {
      accept: '.pdf,.doc,.docx,.txt,.rtf,.odt,.pages',
      maxSize: 25 * 1024 * 1024, // 25MB
      extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages']
    },
    archives: {
      accept: '.zip,.rar,.7z,.tar,.gz',
      maxSize: 100 * 1024 * 1024, // 100MB
      extensions: ['zip', 'rar', '7z', 'tar', 'gz']
    }
  };
};

export const validateFileSize = (file, type) => {
  const fileTypes = getMobileFileTypes();
  const config = fileTypes[type];
  
  if (config && file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    throw new Error(`File must be less than ${maxSizeMB}MB`);
  }
  
  return true;
};

export const validateFileType = (file, type) => {
  const fileTypes = getMobileFileTypes();
  const config = fileTypes[type];
  
  if (config) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!config.extensions.includes(extension)) {
      throw new Error(`File type not supported. Allowed: ${config.extensions.join(', ')}`);
    }
  }
  
  return true;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const getFileIcon = (fileType, extension) => {
  const ext = extension?.toLowerCase();
  
  // Mobile-specific file types
  const mobileTypes = {
    // App files
    apk: { icon: '📱', color: 'purple' },
    ipa: { icon: '📱', color: 'purple' },
    app: { icon: '📱', color: 'purple' },
    
    // Audio files
    mp3: { icon: '🎵', color: 'pink' },
    wav: { icon: '🎵', color: 'pink' },
    aac: { icon: '🎵', color: 'pink' },
    m4a: { icon: '🎵', color: 'pink' },
    
    // Video files
    mp4: { icon: '🎬', color: 'purple' },
    mov: { icon: '🎬', color: 'purple' },
    avi: { icon: '🎬', color: 'purple' },
    
    // Image files
    heic: { icon: '🖼️', color: 'green' },
    heif: { icon: '🖼️', color: 'green' },
    webp: { icon: '🖼️', color: 'green' }
  };
  
  return mobileTypes[ext] || { icon: '📄', color: 'gray' };
};

export const handleWebShare = async (file, title = 'Share file') => {
  if (!isWebShareSupported()) {
    throw new Error('Web Share API not supported');
  }
  
  try {
    const shareData = {
      title,
      text: `Check out this file: ${file.name}`,
      files: [file]
    };
    
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    } else {
      throw new Error('Cannot share this file type');
    }
  } catch (error) {
    console.error('Web Share failed:', error);
    throw error;
  }
};

export const createFileInput = (options = {}) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = options.accept || '*/*';
  input.capture = options.capture || undefined;
  input.multiple = options.multiple || false;
  
  return new Promise((resolve, reject) => {
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        resolve(files);
      } else {
        reject(new Error('No file selected'));
      }
    };
    
    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };
    
    input.click();
  });
};

export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => resolve(blob),
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const getMobileFileSharingCapabilities = () => {
  return {
    webShare: isWebShareSupported(),
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    dragDrop: 'draggable' in document.createElement('div'),
    fileSystem: 'showOpenFilePicker' in window,
    clipboard: 'clipboard' in navigator,
    isMobile: isMobileDevice()
  };
};
