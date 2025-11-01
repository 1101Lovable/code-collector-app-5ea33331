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

    // Fetch the JSON file via HTTP
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/data/seoul-cultural-events.json`;
    console.log('Fetching from:', publicUrl);
    
    let response;
    try {
      response = await fetch(publicUrl);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      // Fallback to reading from GitHub raw or direct URL
      const fallbackUrl = 'https://tdfgluutpkzfhtdriqab.supabase.co/data/seoul-cultural-events.json';
      console.log('Trying fallback URL:', fallbackUrl);
      response = await fetch(fallbackUrl);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data fetched successfully, parsing events...');

    const events = data.DATA;
    console.log(`Total events to import: ${events.length}`);
    
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(events.length / batchSize)}`);
      
      const mappedEvents = batch.map((event: any) => {
        // Convert timestamp to ISO string
        const convertTimestamp = (ts: any) => {
          if (!ts) return null;
          try {
            return new Date(ts).toISOString();
          } catch (e) {
            console.error('Error converting timestamp:', ts, e);
            return null;
          }
        };

        return {
          title: event.title || '',
          program_description: event.program || null,
          theme: event.themecode || null,
          event_type: event.codename || null,
          place: event.place || null,
          district: event.guname || null,
          organization: event.org_name || null,
          performers: event.player || null,
          target_audience: event.use_trgt || null,
          fee: event.use_fee || null,
          detail_url: event.hmpg_addr || null,
          event_time: event.pro_time || null,
          main_image: event.main_img || null,
          longitude: event.lot ? parseFloat(event.lot) : null,
          latitude: event.lat ? parseFloat(event.lat) : null,
          is_free: event.is_free === '무료',
          start_date: convertTimestamp(event.strtdate),
          end_date: convertTimestamp(event.end_date),
        };
      });

      const { data: insertedData, error } = await supabase
        .from('cultural_events')
        .insert(mappedEvents);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        errors += batch.length;
      } else {
        console.log(`Batch ${i / batchSize + 1} imported successfully`);
        imported += batch.length;
      }
    }
    
    console.log(`Import completed: ${imported} imported, ${errors} errors`);

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
