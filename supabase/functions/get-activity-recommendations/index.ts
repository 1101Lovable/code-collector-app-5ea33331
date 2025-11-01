import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { district } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch cultural events for the district
    const today = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
      .from("cultural_events")
      .select("*")
      .eq("district", district)
      .gte("end_date", today)
      .order("start_date", { ascending: true })
      .limit(5);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    // Fetch cultural spaces for the district
    const { data: spaces, error: spacesError } = await supabase
      .from("cultural_spaces")
      .select("*")
      .eq("district", district)
      .limit(3);

    if (spacesError) {
      console.error("Error fetching spaces:", spacesError);
    }

    // Prepare context for GPT
    const eventsContext =
      events && events.length > 0
        ? events
            .map(
              (e) =>
                `- ${e.title} (${e.place || "장소 미정"}): ${e.program_description || e.event_type || "문화 행사"}`,
            )
            .join("\n")
        : "현재 등록된 행사가 없습니다.";

    const spacesContext =
      spaces && spaces.length > 0
        ? spaces.map((s) => `- ${s.name} (${s.address}): ${s.description || s.category || "문화 공간"}`).join("\n")
        : "현재 등록된 문화 공간이 없습니다.";

    const prompt = `당신은 어르신들을 위한 친절한 활동 추천 도우미입니다. 
${district} 지역의 문화 정보를 바탕으로, 오늘 하루 즐길 수 있는 활동을 3개 추천해주세요.

이용 가능한 문화 행사:
${eventsContext}

이용 가능한 문화 공간:
${spacesContext}

다음 형식으로 추천해주세요:
1. **활동명**: 간단한 설명 (30자 이하)
2. **활동명**: 간단한 설명 (30자 이하)
3. **활동명**: 간단한 설명 (30자 이하)

추천은 어르신들이 즐길 수 있고, 건강에 좋으며, 접근하기 쉬운 활동 위주로 해주세요.
가능하면 위의 실제 데이터에서 활동을 선택하되, 없다면 일반적인 건강하고 유익한 활동을 추천해주세요.
또한, 종료일이 임박한 행사를 우선적으로 추천해주세요.
그리고 반드시 활동에 대한 설명은 매우 짧게 작성해주세요.`;

    console.log("Calling OpenAI with prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "당신은 어르신들을 위한 친절하고 배려심 깊은 활동 추천 도우미입니다. 건강하고 즐거운 활동을 추천해주세요.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    console.log("Recommendation generated:", recommendation);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-activity-recommendations function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
