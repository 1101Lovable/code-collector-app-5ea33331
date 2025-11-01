import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type } = await req.json()

    if (type === 'events') {
      // Load and import cultural events
      const eventsData = await fetch(new URL('../../../public/data/cultural-events.json', import.meta.url))
      const eventsJson = await eventsData.json()
      
      const events = eventsJson.DATA.map((item: any) => ({
        title: item.title,
        organization: item.org_name,
        district: item.guname,
        place: item.place,
        event_type: item.codename,
        theme: item.themecode,
        start_date: item.strtdate ? new Date(item.strtdate).toISOString() : null,
        end_date: item.end_date ? new Date(item.end_date).toISOString() : null,
        event_time: item.pro_time,
        is_free: item.is_free === '무료',
        fee: item.use_fee,
        target_audience: item.use_trgt,
        performers: item.player,
        program_description: item.program,
        latitude: item.lat ? parseFloat(item.lat) : null,
        longitude: item.lot ? parseFloat(item.lot) : null,
        main_image: item.main_img,
        detail_url: item.hmpg_addr
      }))

      // Insert events in batches
      const batchSize = 100
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize)
        const { error } = await supabase
          .from('cultural_events')
          .insert(batch)
        
        if (error) {
          console.error('Error inserting events batch:', error)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: `Imported ${events.length} events` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (type === 'spaces') {
      // Load and import cultural spaces
      const spacesData = await fetch(new URL('../../../public/data/cultural-spaces.json', import.meta.url))
      const spacesJson = await spacesData.json()
      
      const spaces = spacesJson.DATA.map((item: any) => ({
        name: item.fac_name,
        district: item.gngu,
        address: item.addr,
        phone: item.phne,
        homepage: item.homepage,
        description: item.fac_desc,
        open_hours: item.openhour,
        closed_days: item.closeday,
        is_free: item.entrfree === '무료',
        entrance_fee: item.entr_fee,
        category: item.subjcode,
        latitude: item.x_coord ? parseFloat(item.x_coord) : null,
        longitude: item.y_coord ? parseFloat(item.y_coord) : null,
        main_image: item.main_img
      }))

      // Insert spaces in batches
      const batchSize = 100
      for (let i = 0; i < spaces.length; i += batchSize) {
        const batch = spaces.slice(i, i + batchSize)
        const { error } = await supabase
          .from('cultural_spaces')
          .insert(batch)
        
        if (error) {
          console.error('Error inserting spaces batch:', error)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: `Imported ${spaces.length} spaces` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use "events" or "spaces"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})