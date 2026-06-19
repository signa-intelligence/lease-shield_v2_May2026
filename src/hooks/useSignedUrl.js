import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Resolves a renderable URL for a file that may be private (file_uri) or
 * a legacy public URL (file_url / file_urls[]).
 *
 * If a private uri exists, it requests a short-lived signed URL from the
 * backend (ownership-checked). Otherwise it falls back to the legacy public URL.
 *
 * @param {Object} opts
 * @param {string} opts.entity   'Document' | 'Lease' | 'Case'
 * @param {string} opts.id       record id
 * @param {string} opts.field    uri field path (e.g. 'file_uri', 'file_uris', 'letter_pack_uri', 'letters.deposit_uri')
 * @param {number} [opts.index]  array index when field is an array
 * @param {string} [opts.fallbackUrl]  legacy public url to use when no private uri exists
 * @param {boolean} [opts.hasUri] whether a private uri actually exists (skip backend call if false)
 * @param {boolean} [opts.enabled=true]
 */
export function useSignedUrl({ entity, id, field, index, fallbackUrl, hasUri, enabled = true }) {
  const query = useQuery({
    queryKey: ['signedUrl', entity, id, field, index],
    queryFn: async () => {
      const res = await base44.functions.invoke('resolveFileUrl', { entity, id, field, index });
      return res.data?.signed_url || null;
    },
    enabled: !!(enabled && hasUri && entity && id && field),
    // Signed URLs are short-lived; refetch before they expire
    staleTime: 4 * 60 * 1000,
    gcTime: 4 * 60 * 1000,
    retry: 1,
  });

  // Prefer signed url; fall back to legacy public url for pre-migration records
  const url = hasUri ? query.data : fallbackUrl;
  return {
    url: url || fallbackUrl || null,
    isLoading: hasUri ? query.isLoading : false,
    error: query.error,
  };
}

/**
 * Imperative resolver for download/open click handlers.
 * Returns a renderable URL string (signed if private, else fallback).
 */
export async function resolveUrlNow({ entity, id, field, index, fallbackUrl, hasUri }) {
  if (!hasUri) return fallbackUrl || null;
  const res = await base44.functions.invoke('resolveFileUrl', { entity, id, field, index });
  return res.data?.signed_url || fallbackUrl || null;
}