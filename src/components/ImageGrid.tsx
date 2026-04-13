import { motion } from "framer-motion";
import { Image as ImageIcon, Copy, Trash2 } from "lucide-react";

export interface SearchResult {
  id: string;
  path: string;
  filename: string;
  similarity: number;
  group_id?: number;
  is_duplicate?: boolean;
}

interface ImageGridProps {
  results: SearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
}

const ImageGrid = ({ results, isLoading, hasSearched }: ImageGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-muted-foreground"
      >
        <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No matching images found</p>
        <p className="text-sm mt-1">Try a different description or broader terms</p>
      </motion.div>
    );
  }

  if (!hasSearched) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-muted-foreground"
      >
        <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">Search your local gallery</p>
        <p className="text-sm mt-1">Describe what you're looking for in natural language</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {results.map((result, index) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary/40 transition-colors cursor-pointer"
        >
          <img
            src={`http://localhost:8000/file?path=${encodeURIComponent(result.path)}`}
            alt={result.filename}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-xs font-mono text-foreground truncate">{result.filename}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-primary">
                  {(result.similarity * 100).toFixed(1)}% match
                </span>
                <div className="flex gap-1">
                  {result.is_duplicate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                      <Copy className="h-3 w-3 inline" /> Dup
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Similarity badge */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-background/70 text-primary backdrop-blur-sm">
            {(result.similarity * 100).toFixed(0)}%
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ImageGrid;
