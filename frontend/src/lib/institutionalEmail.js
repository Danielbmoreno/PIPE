// Format check only. Auth, the active institutional profile and RLS authorize access.
export const isInstitutionalEmail = (value) => /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+edu(?:\.co)?$/i.test(String(value || '').trim());
