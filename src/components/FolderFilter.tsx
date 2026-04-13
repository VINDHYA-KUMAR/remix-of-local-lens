import { FolderOpen } from "lucide-react";

interface FolderFilterProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
}

const FolderFilter = ({ folders, selectedFolder, onSelectFolder }: FolderFilterProps) => {
  if (folders.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
      <button
        onClick={() => onSelectFolder(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selectedFolder === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        All folders
      </button>
      {folders.map((folder) => (
        <button
          key={folder}
          onClick={() => onSelectFolder(folder)}
          className={`px-3 py-1 rounded-full text-xs font-mono transition-colors truncate max-w-[200px] ${
            selectedFolder === folder
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {folder.split(/[/\\]/).pop()}
        </button>
      ))}
    </div>
  );
};

export default FolderFilter;
