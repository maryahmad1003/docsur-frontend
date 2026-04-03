export function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export function normalizeItem(payload, key = null) {
  if (!payload) return null;
  if (key && payload?.data?.[key]) return payload.data[key];
  if (key && payload?.[key]) return payload[key];
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export function formatGeneratedRef(prefix, id) {
  if (!id) return `${prefix}-N/A`;
  return `${prefix}-${String(id).padStart(6, '0')}`;
}
