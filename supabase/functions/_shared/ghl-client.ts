// Shared GoHighLevel Private Integration client.
//
// Reads GHL_PRIVATE_INTEGRATION_TOKEN (aka PIT) and GHL_LOCATION_ID from
// Edge Function secrets. Private Integration tokens are *location-scoped*,
// so every call must include the locationId either as a query param or
// in the request body (depending on endpoint).
//
// Endpoints used by AlphaLuxClean:
//   - POST   /contacts/upsert
//   - PUT    /contacts/{contactId}
//   - GET    /contacts/search/duplicate?locationId&email|phone
//   - POST   /contacts/{contactId}/tags
//   - GET    /locations/{locationId}/customFields
//   - POST   /opportunities/
//   - GET    /opportunities/pipelines
//
// All calls include Version: 2021-07-28 per the LeadConnector API spec.

export const GHL_BASE = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

export interface GHLCustomFieldValue {
  /** Custom field id (preferred) or key. LeadConnector accepts either. */
  id?: string;
  key?: string;
  field_value: unknown;
}

export interface GHLContactUpsert {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  source?: string | null;
  website?: string | null;
  tags?: string[];
  customFields?: GHLCustomFieldValue[];
  companyName?: string | null;
  dnd?: boolean;
}

export interface GHLClient {
  token: string;
  locationId: string;
  request(
    path: string,
    init?: RequestInit & { query?: Record<string, string | number | undefined> },
  ): Promise<{ ok: boolean; status: number; data: any; raw: string }>;
  upsertContact(body: GHLContactUpsert): Promise<{ ok: boolean; contactId?: string; data: any }>;
  addTags(contactId: string, tags: string[]): Promise<{ ok: boolean; data: any }>;
  listCustomFields(): Promise<{ ok: boolean; fields: Array<{ id: string; name: string; fieldKey: string; dataType?: string }>; data: any }>;
  findContactByEmail(email: string): Promise<{ ok: boolean; contactId?: string; data: any }>;
  createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    customFields?: GHLCustomFieldValue[];
  }): Promise<{ ok: boolean; opportunityId?: string; data: any }>;
  listPipelines(): Promise<{ ok: boolean; pipelines: Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>; data: any }>;
}

/** Read token + location from env. Throws if missing. */
export function readGhlCredentials(): { token: string; locationId: string } {
  const token =
    Deno.env.get('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    Deno.env.get('GOHIGHLEVEL_API_KEY') ||
    '';
  const locationId =
    Deno.env.get('GHL_LOCATION_ID') ||
    Deno.env.get('GOHIGHLEVEL_LOCATION_ID') ||
    '';
  if (!token) {
    throw new Error(
      'GHL_PRIVATE_INTEGRATION_TOKEN (or legacy GOHIGHLEVEL_API_KEY) is not configured for this edge function.',
    );
  }
  if (!locationId) {
    throw new Error(
      'GHL_LOCATION_ID (or legacy GOHIGHLEVEL_LOCATION_ID) is not configured for this edge function. Private Integration tokens are location-scoped and require a locationId.',
    );
  }
  return { token, locationId };
}

export function createGhlClient(overrides?: {
  token?: string;
  locationId?: string;
}): GHLClient {
  const creds = overrides?.token && overrides?.locationId
    ? { token: overrides.token, locationId: overrides.locationId }
    : readGhlCredentials();

  async function request(
    path: string,
    init?: RequestInit & { query?: Record<string, string | number | undefined> },
  ) {
    const url = new URL(path.startsWith('http') ? path : `${GHL_BASE}${path}`);
    if (init?.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${creds.token}`);
    headers.set('Version', GHL_API_VERSION);
    headers.set('Accept', 'application/json');
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url.toString(), { ...init, headers });
    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_) {
      data = raw;
    }
    return { ok: res.ok, status: res.status, data, raw };
  }

  async function upsertContact(body: GHLContactUpsert) {
    // /contacts/upsert creates or updates based on email / phone match,
    // which is exactly the behaviour we want for idempotent form posts.
    const res = await request('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        locationId: creds.locationId,
      }),
    });
    const contactId =
      res.data?.contact?.id ||
      res.data?.id ||
      res.data?.contactId;
    return { ok: res.ok, contactId, data: res.data };
  }

  async function addTags(contactId: string, tags: string[]) {
    if (!contactId || !tags?.length) return { ok: true, data: null };
    const res = await request(`/contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
    return { ok: res.ok, data: res.data };
  }

  async function listCustomFields() {
    const res = await request(`/locations/${creds.locationId}/customFields`, {
      method: 'GET',
    });
    const rawFields: any[] = res.data?.customFields || res.data?.fields || [];
    const fields = rawFields.map((f: any) => ({
      id: f.id || f._id,
      name: f.name || f.label,
      fieldKey: f.fieldKey || f.key || f.name,
      dataType: f.dataType || f.type,
    }));
    return { ok: res.ok, fields, data: res.data };
  }

  async function findContactByEmail(email: string) {
    const res = await request('/contacts/search/duplicate', {
      method: 'GET',
      query: { locationId: creds.locationId, email },
    });
    const contactId = res.data?.contact?.id || res.data?.id;
    return { ok: res.ok, contactId, data: res.data };
  }

  async function listPipelines() {
    const res = await request('/opportunities/pipelines', {
      method: 'GET',
      query: { locationId: creds.locationId },
    });
    const pipelines: any[] = res.data?.pipelines || [];
    return { ok: res.ok, pipelines, data: res.data };
  }

  async function createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    customFields?: GHLCustomFieldValue[];
  }) {
    const res = await request('/opportunities/', {
      method: 'POST',
      body: JSON.stringify({
        pipelineId: params.pipelineId,
        locationId: creds.locationId,
        name: params.name,
        pipelineStageId: params.stageId,
        status: params.status || 'open',
        contactId: params.contactId,
        monetaryValue: params.monetaryValue,
        source: params.source,
        customFields: params.customFields,
      }),
    });
    const opportunityId = res.data?.opportunity?.id || res.data?.id;
    return { ok: res.ok, opportunityId, data: res.data };
  }

  return {
    token: creds.token,
    locationId: creds.locationId,
    request,
    upsertContact,
    addTags,
    listCustomFields,
    findContactByEmail,
    listPipelines,
    createOpportunity,
  };
}

/**
 * Best-effort mapping of AlphaLuxClean booking/lead fields onto the
 * GHL subaccount's custom fields. We look up fields by `fieldKey` /
 * `name` so that renaming or reordering them in the GHL UI won't break
 * the integration \u2014 only the *labels* have to stay recognizable.
 */
export function buildCustomFieldMap(
  fields: Array<{ id: string; name: string; fieldKey: string }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    const keys = [f.fieldKey, f.name]
      .filter(Boolean)
      .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
    for (const k of keys) {
      if (!map[k]) map[k] = f.id;
    }
  }
  return map;
}

/** Resolve a logical field name to a GHL custom-field id. */
export function resolveFieldId(
  map: Record<string, string>,
  candidates: string[],
): string | undefined {
  for (const c of candidates) {
    const norm = c.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (map[norm]) return map[norm];
  }
  return undefined;
}
