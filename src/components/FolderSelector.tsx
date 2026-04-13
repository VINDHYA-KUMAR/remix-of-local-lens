import { useState } from "react";
import { FolderOpen, Loader2, Check, HardDrive } from "lucide-react";
import { motion } from "framer-motion";

interface FolderSelectorProps {
  onIndex: (path: string) => void;
  isIndexing: boolean;
  indexedFolders: string[];
  indexedCount: number;
}

const FolderSelector = ({ onIndex, isIndexing, indexedFolders, indexedCount }: FolderSelectorProps) => {
  const [folderPath, setFolderPath] = useState("");

  const handleSubmit = () => {
    if (folderPath.trim()) {
      onIndex(folderPath.trim());
      setFolderPath("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="h-4 w-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm text-foreground">Local Gallery</h3>
        {indexedCount > 0 && (
          <span className="ml-auto text-xs font-mono text-primary">{indexedCount} images indexed</span>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Enter folder path (e.g. C:/Users/.../Pictures)"
          className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors font-mono"
        />
        <button
          onClick={handleSubmit}
          disabled={!folderPath.trim() || isIndexing}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:brightness-110 transition-all flex items-center gap-2"
        >
          {isIndexing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <FolderOpen className="h-3.5 w-3.5" />
              Index
            </>
          )}
        </button>
      </div>

      {indexedFolders.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Indexed folders:</p>
          {indexedFolders.map((folder) => (
            <div key={folder} className="flex items-center gap-2 text-xs font-mono text-secondary-foreground bg-muted rounded-md px-2.5 py-1.5">
              <Check className="h-3 w-3 text-success shrink-0" />
              <span className="truncate">{folder}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FolderSelector;
