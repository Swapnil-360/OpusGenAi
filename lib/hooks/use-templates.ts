"use client";

import { useEffect, useState } from "react";
import { selectPublic } from "@/lib/supabase/public-rest";
import type { Template, TemplateType } from "@/lib/templates-data";

interface TemplateRow {
  id: string;
  name: string;
  template_type: TemplateType;
  category: string;
  description: string;
  tags: string[];
  /** Absent on the public (anon) path — the column is revoked from the anon
   *  role so prompts can't be scraped without an account. */
  prompt?: string | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  accent_color: string;
  is_pro: boolean;
  sort_order: number;
}

function mapRow(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    templateType: row.template_type,
    category: row.category,
    description: row.description,
    tags: row.tags ?? [],
    prompt: row.prompt ?? "",
    coverImageUrl: row.cover_image_url,
    previewVideoUrl: row.preview_video_url,
    accentColor: row.accent_color,
    isPro: row.is_pro,
    sortOrder: row.sort_order,
  };
}

// Everything except `prompt` — the only columns the anon role is granted.
const PUBLIC_COLUMNS =
  "id,name,template_type,category,description,tags,cover_image_url,preview_video_url,accent_color,is_pro,sort_order";

interface UseTemplatesOptions {
  /** Signed-in surfaces (dashboard) fetch through /api/templates so prompts
   *  are included. Public surfaces (the landing page) leave this false and
   *  get everything except the prompt. */
  withPrompts?: boolean;
}

// Small, rarely-changing table (~40 rows) — fetched fresh on every mount so
// admin edits show up immediately rather than behind a stale cache.
export function useTemplates({ withPrompts = false }: UseTemplatesOptions = {}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(isRetry = false) {
      setLoading(true);
      setError(false);
      try {
        let rows: TemplateRow[];
        if (withPrompts) {
          const res = await fetch("/api/templates", { cache: "no-store" });
          if (!res.ok) throw new Error(`templates fetch failed (${res.status})`);
          rows = (await res.json()).templates ?? [];
        } else {
          rows = await selectPublic<TemplateRow>(
            "templates",
            `select=${PUBLIC_COLUMNS}&order=sort_order.asc`
          );
        }
        if (cancelled) return;
        setTemplates(rows.map(mapRow));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // One retry covers a transient network blip / aborted timeout.
        if (!isRetry) { load(true); return; }
        console.error("Failed to load templates:", err);
        setLoading(false);
        setError(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [reloadKey, withPrompts]);

  const refetch = () => setReloadKey((k) => k + 1);

  return { templates, loading, error, refetch };
}
