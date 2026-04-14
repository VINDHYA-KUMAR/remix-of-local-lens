import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageId, storageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to describe the image
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
            content: "You are an image description assistant. Describe the image in detail for search purposes. Include: objects, people, colors, setting, mood, actions, clothing, nature elements. Output a single paragraph description followed by a newline and then comma-separated tags. Format:\nDESCRIPTION\nTAGS: tag1, tag2, tag3",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in detail for search indexing." },
              { type: "image_url", image_url: { url: storageUrl } },
            ],
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
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse description and tags
    const lines = content.split("\n").filter((l: string) => l.trim());
    let description = content;
    let tags: string[] = [];

    const tagsLine = lines.find((l: string) => l.toLowerCase().startsWith("tags:"));
    if (tagsLine) {
      tags = tagsLine.replace(/^tags:\s*/i, "").split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      description = lines.filter((l: string) => !l.toLowerCase().startsWith("tags:")).join(" ").trim();
    }

    // Update the image record
    const { error: updateError } = await supabase
      .from("images")
      .update({ description, tags })
      .eq("id", imageId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ description, tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("describe-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
