import { File, FileText, FileSpreadsheet, FileImage, FileVideo, FileAudio, FileArchive, FileCode, Smartphone, Music } from "lucide-react";

const FileIcon = ({ fileType, extension, size = 24 }) => {
  const getIconAndColor = () => {
    // Check by MIME type first
    if (fileType?.startsWith("image/")) {
      return { Icon: FileImage, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900" };
    }
    if (fileType?.startsWith("video/")) {
      return { Icon: FileVideo, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900" };
    }
    if (fileType?.startsWith("audio/")) {
      return { Icon: FileAudio, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900" };
    }

    // Check by extension
    const ext = extension?.toLowerCase();
    
    // Documents
    if (["pdf", "doc", "docx", "txt", "rtf", "odt", "pages"].includes(ext)) {
      return { Icon: FileText, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900" };
    }
    
    // Spreadsheets
    if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) {
      return { Icon: FileSpreadsheet, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900" };
    }
    
    // Archives
    if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) {
      return { Icon: FileArchive, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900" };
    }
    
    // Code files
    if (["js", "jsx", "ts", "tsx", "py", "java", "html", "css", "json", "xml", "php", "rb", "go", "rs"].includes(ext)) {
      return { Icon: FileCode, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900" };
    }

    // Mobile-specific formats
    if (["apk", "ipa", "app", "dmg", "pkg"].includes(ext)) {
      return { Icon: Smartphone, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900" };
    }

    // Audio formats (including mobile)
    if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "aiff"].includes(ext)) {
      return { Icon: Music, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900" };
    }

    // Default
    return { Icon: File, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900" };
  };

  const { Icon, color, bg } = getIconAndColor();

  return (
    <div className={`p-2 ${bg} rounded-lg`}>
      <Icon size={size} className={color} />
    </div>
  );
};

export default FileIcon;