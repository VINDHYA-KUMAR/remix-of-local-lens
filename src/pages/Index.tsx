import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Cloud } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ImageGrid, { type SearchResult } from "@/components/ImageGrid";
import ImageUploader from "@/components/ImageUploader";
import ChatPanel from "@/components/ChatPanel";
import StatsBar from "@/components/StatsBar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [totalImages, setTotalImages] = useState(0);
  const [analyzedImages, setAnalyzedImages] = useState(0);

  const fetchStats = useCallback(async () => {
    const { count: total } = await supabase.from("images").select("*", { count: "exact", head: true });
    const { count: analyzed } = await supabase.from("images").select("*", { count: "exact", head: true }).not("description", "is", null);
    setTotalImages(total || 0);
    setAnalyzedImages(analyzed || 0);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-images", {
        body: { query },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch (e: any) {
      console.error("Search error:", e);
      toast({ title: "Search failed", description: e.message || "Could not search images.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

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
              <p className="text-[11px] text-muted-foreground font-mono">AI Image Search</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-mono text-success">
            <Cloud className="h-3.5 w-3.5" /> Cloud
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="container py-8 space-y-6">
        <StatsBar
          totalImages={totalImages}
          indexedFolders={0}
          groups={analyzedImages}
          duplicates={0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <ImageUploader
              onUploadComplete={fetchStats}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              uploadedCount={totalImages}
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-5">
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
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
