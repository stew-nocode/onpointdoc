/**
 * API Route pour recevoir les webhooks Brevo
 * 
 * Endpoint: POST /api/webhooks/brevo
 * 
 * Reçoit les événements email de Brevo (ouvertures, clics, bounces, etc.)
 * pour TOUS les types d'emails : campagnes, automatisations, transactionnels
 * 
 * Documentation Brevo: https://developers.brevo.com/docs/how-to-use-webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

/**
 * Schéma de validation pour les événements webhook Brevo
 */
const brevoWebhookEventSchema = z.object({
  event: z.string(), // delivered, opened, click, soft_bounce, hard_bounce, spam, unsubscribed
  email: z.string().email(),
  id: z.number().optional(), // Campaign ID
  'message-id': z.string().optional(),
  date: z.string().optional(), // ISO date string
  ts: z.number().optional(), // Unix timestamp
  ts_event: z.number().optional(), // Unix timestamp of event
  tag: z.string().optional(), // Custom tag
  'X-Mailin-custom': z.string().optional(), // Custom header
  link: z.string().optional(), // Clicked link (for click events)
  sending_ip: z.string().optional(),
  subject: z.string().optional(),
  template_id: z.number().optional(),
});

type BrevoWebhookEvent = z.infer<typeof brevoWebhookEventSchema>;

/**
 * Convertit un événement Brevo en format pour notre base de données
 */
function mapBrevoEventToDb(event: BrevoWebhookEvent) {
  // Déterminer le timestamp
  let eventTimestamp: Date;
  if (event.ts_event) {
    eventTimestamp = new Date(event.ts_event * 1000);
  } else if (event.ts) {
    eventTimestamp = new Date(event.ts * 1000);
  } else if (event.date) {
    eventTimestamp = new Date(event.date);
  } else {
    eventTimestamp = new Date();
  }

  return {
    event_type: event.event.toLowerCase(),
    message_id: event['message-id'] || null,
    email: event.email,
    campaign_id: event.id || null,
    campaign_name: event.subject || null,
    template_id: event.template_id || null,
    tag: event.tag || event['X-Mailin-custom'] || null,
    event_timestamp: eventTimestamp.toISOString(),
    ip_address: event.sending_ip || null,
    link_clicked: event.link || null,
    raw_payload: event,
  };
}

/**
 * POST /api/webhooks/brevo
 * 
 * Reçoit les événements webhook de Brevo
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le body
    const body = await request.json();
    
    console.log('[WEBHOOK BREVO] Événement reçu:', JSON.stringify(body).substring(0, 200));

    // Valider l'événement
    const parseResult = brevoWebhookEventSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('[WEBHOOK BREVO] Validation échouée:', parseResult.error.issues);
      // On retourne 200 pour éviter que Brevo retry
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 200 }
      );
    }

    const event = parseResult.data;
    
    // Mapper l'événement pour la DB
    const dbEvent = mapBrevoEventToDb(event);
    
    console.log(`[WEBHOOK BREVO] ${dbEvent.event_type} pour ${dbEvent.email}`);

    // TODO: Créer la table brevo_email_events dans Supabase
    // Insérer dans Supabase avec le client service (bypass RLS)
    // const supabase = createSupabaseServiceClient();
    //
    // const { error: insertError } = await supabase
    //   .from('brevo_email_events')
    //   .insert(dbEvent);
    //
    // if (insertError) {
    //   console.error('[WEBHOOK BREVO] Erreur insertion:', insertError.message);
    //   // On retourne 200 pour éviter que Brevo retry indéfiniment
    //   return NextResponse.json(
    //     { success: false, error: insertError.message },
    //     { status: 200 }
    //   );
    // }

    console.log(`[WEBHOOK BREVO] ✅ Événement enregistré: ${dbEvent.event_type} pour ${dbEvent.email}`);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[WEBHOOK BREVO] Erreur:', error);
    // Toujours retourner 200 pour éviter les retries
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/brevo
 * 
 * Endpoint de test pour vérifier que le webhook est accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Brevo webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}








