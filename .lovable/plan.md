## Problem

Entering a Texas (e.g. `77001`) or California (e.g. `90001`) ZIP on `/book/zip` returns:

> "Sorry, AlphaLux Cleaning is currently only servicing New York State. ZIP XXXXX is outside our service area."

This is **not** a database problem. The Supabase `service_areas` table already has all three states active: **CA: 410, TX: 333, NY: 194** zips.

The cause is the **deployed `validate-zip` edge function**. Its live code only allows NY zips, even though the repo source at `supabase/functions/validate-zip/index.ts` already includes the full TX + CA + NY range tables. The deployed version is stale (it predates the multi-state work). A direct cURL of the function confirms this:

```text
POST /validate-zip {"zipCode":"77001"} -> isValid:false, "...only servicing New York State..."
POST /validate-zip {"zipCode":"90001"} -> isValid:false, "...only servicing New York State..."
POST /validate-zip {"zipCode":"10001"} -> isValid:true, NY
```

## Fix

Re-deploy the existing `supabase/functions/validate-zip/index.ts` so the multi-state validator (TX + CA + NY ranges + DB lookup) goes live.

To force a clean redeploy and remove any drift, I will:

1. Make a small no-op edit (bump a version comment) at the top of `supabase/functions/validate-zip/index.ts` so the function is republished by the platform.
2. Verify the live function with cURL after deploy:
   - `77001` (Houston, TX) -> isValid: true, state: TX
   - `90001` (Los Angeles, CA) -> isValid: true, state: CA
   - `75001` (Dallas, TX) -> isValid: true, state: TX
   - `94102` (San Francisco, CA) -> isValid: true, state: CA
   - `10001` (NYC) -> isValid: true, state: NY (regression check)
   - `60601` (Chicago, IL) -> isValid: false (out-of-area check)

## What I will NOT change

- No DB migration (the `service_areas` table is already correct).
- No changes to `src/lib/service-area-validation.ts` (also already correct).
- No copy/UI changes on `/book/zip`.
- No changes to messaging — the existing function returns "Sorry, we don't service {zip} yet" for true out-of-area zips, which is fine.

## Deliverable

After redeploy, entering any TX or CA ZIP on the booking flow will validate successfully and proceed to the next step, with the correct city/state populated in booking context.
