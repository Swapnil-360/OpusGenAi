"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { withQueryTimeout } from "@/lib/supabase/session-recovery";
import type { Template, TemplateType } from "@/lib/templates-data";

interface TemplateRow {
  id: string;
  name: string;
  template_type: TemplateType;
  category: string;
  description: string;
  tags: string[];
  prompt: string;
  cover_image_url: string | null;
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
    prompt: row.prompt,
    coverImageUrl: row.cover_image_url,
    accentColor: row.accent_color,
    isPro: row.is_pro,
    sortOrder: row.sort_order,
  };
}

// Small, rarely-changing table (~20 rows) — fetched fresh on every mount so
// admin edits show up immediately rather than behind a stale cache.
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(isRetry = false) {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await withQueryTimeout(
        supabase
          .from("templates")
          .select("id, name, template_type, category, description, tags, prompt, cover_image_url, accent_color, is_pro, sort_order")
          .order("sort_order", { ascending: true })
      );

      if (cancelled) return;
      if (error) {
        // A hung request usually means a stuck local auth session — the
        // timeout already cleared it, so one clean retry recovers silently.
        if (!isRetry && error.message === "Request timed out.") {
          load(true);
          return;
        }
        console.error("Failed to load templates:", error.message);
        setLoading(false);
        return;
      }
      setTemplates(((data ?? []) as TemplateRow[]).map(mapRow));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  return { templates, loading, refetch };
}
