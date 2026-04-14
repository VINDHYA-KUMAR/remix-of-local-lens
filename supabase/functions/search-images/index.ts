import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all images with descriptions
    const { data: images, error } = await supabase
      .from("images")
      .select("*")
      .not("description", "is", null);

    if (error) throw error;
    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to rank images by relevance to the query
    const imageList = images.map((img: any, i: number) => 
      `${i}: [${img.filename}] ${img.description} | Tags: ${(img.tags || []).join(", ")}`
    ).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an image search ranking system. Given a search query and a list of image descriptions, return the indices of matching images ranked by relevance, with a similarity score 0-1. Return ONLY valid JSON array like: [{"index":0,"score":0.95},{"index":3,"score":0.72}]. Return at most 20 results. Only include images with score >= 0.3. If nothing matches, return [].`,
          },
          {
            role: "user",
            content: `Search query: "${query}"\n\nImages:\n${imageList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON response, handling markdown code blocks
    let rankings: { index: number; score: number }[] = [];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      rankings = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI rankings:", content);
      rankings = [];
    }

    // Map rankings back to images
    const results = rankings
      .filter((r: any) => r.index >= 0 && r.index < images.length)
      .map((r: any) => {
        const img = images[r.index];
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${img.storage_path}`;
        return {
          id: img.id,
          filename: img.filename,
          url: publicUrl,
          description: img.description,
          tags: img.tags,
          similarity: r.score,
        };
      });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
