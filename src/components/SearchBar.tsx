import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const SearchBar = ({ onSearch, isSearching }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && wordCount <= 20) {
      onSearch(query.trim());
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
        <div className="relative flex items-center rounded-xl bg-card border border-border focus-within:border-primary/50 transition-colors">
          <Search className="ml-4 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the image you're looking for..."
            className="flex-1 bg-transparent px-4 py-3.5 text-foreground placeholder:text-muted-foreground outline-none font-body"
          />
          <div className="flex items-center gap-2 pr-3">
            <span className={`text-xs font-mono ${wordCount > 20 ? "text-destructive" : "text-muted-foreground"}`}>
              {wordCount}/20
            </span>
            <button
              type="submit"
              disabled={!query.trim() || wordCount > 20 || isSearching}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

export default SearchBar;
