import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the JSON file
    const jsonUrl = `${supabaseUrl.replace('.supabase.co', '')}/data/seoul-cultural-events.json`;
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const events = data.DATA;
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      const mappedEvents = batch.map((event: any) => ({
        title: event.title || event.TITLE,
        program_description: event.program || event.PROGRAM,
        theme: event.themecode || event.THEMECODE,
        event_type: event.codename || event.CODENAME,
        place: event.place || event.PLACE,
        district: event.guname || event.GUNAME,
        organization: event.org_name || event.ORG_NAME,
        performers: event.player || event.PLAYER,
        target_audience: event.use_trgt || event.USE_TRGT,
        fee: event.use_fee || event.USE_FEE,
        detail_url: event.hmpg_addr || event.HMPG_ADDR,
        event_time: event.pro_time || event.PRO_TIME,
        main_image: event.main_img || event.MAIN_IMG,
        longitude: event.lot || event.LOT ? parseFloat(event.lot || event.LOT) : null,
        latitude: event.lat || event.LAT ? parseFloat(event.lat || event.LAT) : null,
        is_free: (event.is_free || event.IS_FREE) === '무료',
        start_date: event.strtdate || event.STRTDATE ? new Date(event.strtdate || event.STRTDATE).toISOString() : null,
        end_date: event.end_date || event.END_DATE ? new Date(event.end_date || event.END_DATE).toISOString() : null,
      }));

      const { error } = await supabase
        .from('cultural_events')
        .insert(mappedEvents);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors += batch.length;
      } else {
        imported += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${imported} events, ${errors} errors`,
        total: events.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
