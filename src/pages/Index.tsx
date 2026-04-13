import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Wifi, WifiOff } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ImageGrid, { type SearchResult } from "@/components/ImageGrid";
import FolderSelector from "@/components/FolderSelector";
import ChatPanel from "@/components/ChatPanel";
import StatsBar from "@/components/StatsBar";
import FolderFilter from "@/components/FolderFilter";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:8000";

const Index = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedFolders, setIndexedFolders] = useState<string[]>([]);
  const [indexedCount, setIndexedCount] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [stats, setStats] = useState({ groups: 0, duplicates: 0 });
  const [isOnline, setIsOnline] = useState(false);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      setIsOnline(res.ok);
      return res.ok;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    const online = await checkBackend();
    if (!online) {
      toast({ title: "Backend offline", description: "Start the Python backend server first. See the README for instructions.", variant: "destructive" });
      // Demo results
      setResults([
        { id: "demo-1", path: "/demo/sunset.jpg", filename: "sunset.jpg", similarity: 0.92 },
        { id: "demo-2", path: "/demo/beach.jpg", filename: "beach.jpg", similarity: 0.87 },
        { id: "demo-3", path: "/demo/mountain.jpg", filename: "mountain.jpg", similarity: 0.81, is_duplicate: true },
        { id: "demo-4", path: "/demo/forest.jpg", filename: "forest.jpg", similarity: 0.76 },
        { id: "demo-5", path: "/demo/lake.jpg", filename: "lake.jpg", similarity: 0.73 },
        { id: "demo-6", path: "/demo/city.jpg", filename: "city.jpg", similarity: 0.69 },
      ]);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, folder: selectedFolder }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      toast({ title: "Search failed", description: "Could not connect to backend.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [checkBackend, selectedFolder, toast]);

  const handleIndex = useCallback(async (path: string) => {
    const online = await checkBackend();
    if (!online) {
      toast({ title: "Backend offline", description: "Start the Python backend server first.", variant: "destructive" });
      // Demo
      setIndexedFolders((prev) => [...prev, path]);
      setIndexedCount((prev) => prev + 127);
      setStats({ groups: 12, duplicates: 3 });
      return;
    }

    setIsIndexing(true);
    try {
      const res = await fetch(`${API_BASE}/index-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_path: path }),
      });
      const data = await res.json();
      setIndexedFolders((prev) => [...new Set([...prev, path])]);
      setIndexedCount(data.total_indexed || 0);
      setStats({ groups: data.groups || 0, duplicates: data.duplicates || 0 });
      toast({ title: "Indexing complete", description: `${data.new_images || 0} new images indexed.` });
    } catch {
      toast({ title: "Indexing failed", variant: "destructive" });
    } finally {
      setIsIndexing(false);
    }
  }, [checkBackend, toast]);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground tracking-tight">PixelMind</h1>
              <p className="text-[11px] text-muted-foreground font-mono">Offline AI Image Search</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-success">
                <WifiOff className="h-3.5 w-3.5" /> Local
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <WifiOff className="h-3.5 w-3.5" /> Backend offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-8 space-y-6">
        <StatsBar
          totalImages={indexedCount}
          indexedFolders={indexedFolders.length}
          groups={stats.groups}
          duplicates={stats.duplicates}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <FolderSelector
              onIndex={handleIndex}
              isIndexing={isIndexing}
              indexedFolders={indexedFolders}
              indexedCount={indexedCount}
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-5">
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
            <FolderFilter
              folders={indexedFolders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
            />
            <ImageGrid results={results} isLoading={isSearching} hasSearched={hasSearched} />
          </div>
        </div>
      </main>

      {/* Chatbot */}
      <ChatPanel onSearchFromChat={handleSearch} />
    </div>
  );
};

export default Index;
