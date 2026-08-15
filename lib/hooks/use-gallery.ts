"use client";

import { useEffect, useState } from "react";
import { selectPublic } from "@/lib/supabase/public-rest";

export interface GalleryItem {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  coverImageUrl: string | null;
  caption: string | null;
  createdAt: string;
}

interface GalleryRow {
  id: string;
  media_type: "image" | "video";
  media_url: string;
  cover_image_url: string | null;
  caption: string | null;
  created_at: string;
}

function mapRow(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    coverImageUrl: row.cover_image_url,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

/**
 * Public showcase items, read the same way the landing page reads templates
 * and hero images — straight from the browser to Supabase PostgREST with the
 * anon key, not through this app's server. RLS on gallery_items restricts
 * the anon role to status='approved' rows only (see the migration), so this
 * hook can never see a pending or rejected submission no matter what it asks
 * for; there's no server-side filtering to keep in sync with that.
 */
export function useGalleryItems(limit = 60) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const rows = await selectPublic<GalleryRow>(
          "gallery_items",
          `select=id,media_type,media_url,cover_image_url,caption,created_at&order=sort_order.asc,created_at.desc&limit=${limit}`
        );
        if (cancelled) return;
        setItems(rows.map(mapRow));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load gallery items:", err);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return { items, loading, error };
}
