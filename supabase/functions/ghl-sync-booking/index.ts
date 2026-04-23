// ghl-sync-booking — after a booking is completed (address + schedule
// saved), push the full booking payload into GoHighLevel:
//
//   1. Upsert the contact and backfill every matching custom field.
//   2. Add tags: `lead - booked`, `customer`, `<service_type>`.
//   3. Create (or skip if already present) an Opportunity in the
//      subaccount's first pipeline, tagged with the service type and
//      dollar value.
//   4. Stamp bookings.ghl_contact_id so downstream syncs don't dupe.
//
// Triggered from save-booking-details (and can be invoked manually from
// an admin tool with `{ booking_id }`).

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  buildCustomFieldMap,
  createGhlClient,
  resolveFieldId,
  type GHLCustomFieldValue,
} from '../_shared/ghl-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function log(step: string, details?: unknown) {
  console.log(
    `[ghl-sync-booking] ${step}${
      details !== undefined ? ' ' + JSON.stringify(details) : ''
    }`,
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bookingId = body?.booking_id || body?.bookingId;
    if (!bookingId) {
      return json({ success: false, error: 'booking_id is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // 1. Load the booking + customer.
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single();
    if (bookingError) throw new Error(`Booking not found: ${bookingError.message}`);

    const customer = booking.customers || {};
    const email: string | null =
      customer.email || booking.full_name || null;
    if (!email) {
      return json({ success: false, error: 'booking has no customer email' }, 422);
    }

    log('loaded booking', { bookingId, email });

    // 2. Build GHL client and field map.
    const ghl = createGhlClient();
    const fieldsRes = await ghl.listCustomFields();
    const fieldMap = buildCustomFieldMap(fieldsRes.fields);

    const fullName =
      booking.full_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.name ||
      '';
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || customer.last_name || '';

    const customFields: GHLCustomFieldValue[] = [];
    const push = (candidates: string[], value: unknown) => {
      if (value === undefined || value === null || value === '') return;
      const id = resolveFieldId(fieldMap, candidates);
      if (id) customFields.push({ id, field_value: value });
    };

    push(['promo_code', 'promocode', 'customer_promo_code'], booking.promo_code);
    push(['promo_discount', 'promo_discount_amount'], booking.promo_discount_cents
      ? booking.promo_discount_cents / 100
      : undefined);
    push(['service_type'], booking.service_type);
    push(['offer_name', 'offer'], booking.offer_name);
    push(['offer_type'], booking.offer_type);
    push(['frequency', 'service_frequency'], booking.frequency);
    push(['service_date', 'scheduled_date'], booking.service_date);
    push(['time_slot', 'scheduled_time'], booking.time_slot);
    push(['deposit_amount', 'deposit'], booking.deposit_amount);
    push(['booking_total', 'total_amount'], booking.est_price || booking.base_price);
    push(['balance_due'], booking.balance_due);
    push(['payment_status'], booking.payment_status);
    push(['booking_id'], booking.id);
    push(['booking_url'], `https://app.alphaluxclean.com/book/confirmation?booking_id=${booking.id}`);
    push(['zip_code', 'postal_code'], booking.zip_code || customer.postal_code);
    push(['home_size'], booking.home_size);
    push(['address_line_1', 'address1', 'service_address'], booking.address_line1 || customer.address_line1);
    push(['address_line_2', 'address2'], booking.address_line2 || customer.address_line2);
    push(['city'], customer.city);
    push(['state'], customer.state);
    push(['special_instructions', 'notes'], booking.special_instructions || booking.notes);
    push(['utm_source'], booking.utms?.utm_source);
    push(['utm_medium'], booking.utms?.utm_medium);
    push(['utm_campaign'], booking.utms?.utm_campaign);
    push(['utm_content'], booking.utms?.utm_content);
    push(['utm_term'], booking.utms?.utm_term);
    push(['landing_page'], booking.utms?.landing_page);
    push(['referrer'], booking.utms?.referrer);
    push(['stripe_payment_intent', 'payment_intent'], booking.stripe_payment_intent_id);
    push(['receipt_url', 'stripe_receipt'], booking.receipt_url);
    push(['is_recurring'], booking.is_recurring ? 'true' : 'false');

    const tags = [
      'lead - booked',
      'customer',
      'alphaluxclean-txca',
      booking.service_type ? `service-${booking.service_type}`.toLowerCase() : '',
      booking.frequency ? `freq-${booking.frequency}`.toLowerCase() : '',
      booking.promo_code ? `promo-${String(booking.promo_code).toLowerCase()}` : '',
    ].filter(Boolean) as string[];

    const upsert = await ghl.upsertContact({
      email,
      phone: customer.phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      name: fullName || undefined,
      address1: booking.address_line1 || customer.address_line1 || undefined,
      address2: booking.address_line2 || customer.address_line2 || undefined,
      city: customer.city || undefined,
      state: customer.state || undefined,
      postalCode: booking.zip_code || customer.postal_code || undefined,
      source: 'AlphaLuxClean TX/CA — booking completed',
      tags,
      customFields,
    });

    const ghlContactId = upsert.contactId || booking.ghl_contact_id || null;

    if (ghlContactId) {
      // Ensure tags are applied even if upsert returned an existing contact
      // (the upsert endpoint ignores tags on some API versions).
      try {
        await ghl.addTags(ghlContactId, tags);
      } catch (e) {
        log('add_tags warn', { error: e instanceof Error ? e.message : String(e) });
      }

      await supabase
        .from('bookings')
        .update({ ghl_contact_id: ghlContactId })
        .eq('id', booking.id);
    }

    // 3. Create an opportunity in the first active pipeline.
    let opportunityId: string | null = null;
    if (ghlContactId) {
      try {
        const pipelines = await ghl.listPipelines();
        const firstPipeline = pipelines.pipelines?.[0];
        if (firstPipeline && firstPipeline.stages?.[0]) {
          const opp = await ghl.createOpportunity({
            pipelineId: firstPipeline.id,
            stageId: firstPipeline.stages[0].id,
            name: `${fullName || email} · ${booking.offer_name || booking.service_type || 'Booking'}`,
            status: 'won',
            contactId: ghlContactId,
            monetaryValue: Number(booking.est_price || booking.base_price || 0),
            source: 'alphaluxclean-txca',
            customFields,
          });
          opportunityId = opp.opportunityId || null;
          log('opportunity', { ok: opp.ok, opportunityId });
        } else {
          log('no pipeline found — skipping opportunity');
        }
      } catch (e) {
        log('opportunity skipped', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // 4. Mark the lead_promo_assignments row as redeemed.
    if (booking.promo_code) {
      await supabase
        .from('lead_promo_assignments')
        .update({
          redeemed_booking_id: booking.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq('code', booking.promo_code);
    }

    return json({
      success: upsert.ok,
      ghl_contact_id: ghlContactId,
      opportunity_id: opportunityId,
      custom_fields_synced: customFields.length,
      tags,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ghl-sync-booking] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
