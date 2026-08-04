"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface HeroImage {
  src: string;
  alt: string;
}

interface HeroSettings {
  mode: "random" | "selected" | "custom";
  templateIds?: string[];
  customImageUrls?: string[];
}

// Resolves what the landing-page hero orbit should show, driven by the
// admin-configured site_settings row ("hero_images"):
// - "custom": admin-uploaded photos, in the order configured
// - "selected": specific templates' cover images, in the order configured
// - "random" (default, and the fallback if the above resolve to nothing —
//   e.g. a selected template's preview hasn't been generated yet): a fresh
//   random sample of template cover images on every load.
export function useHeroImages(count = 8) {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data: settingsRow }, { data: templateRows }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("id", "hero_images").single(),
        supabase.from("templates").select("id, name, cover_image_url").not("cover_image_url", "is", null),
      ]);
      if (cancelled) return;

      const templates = (templateRows ?? []) as { id: string; name: string; cover_image_url: string }[];
      const settings = (settingsRow?.value ?? { mode: "random" }) as HeroSettings;

      let resolved: HeroImage[] = [];

      if (settings.mode === "custom" && settings.customImageUrls?.length) {
        resolved = settings.customImageUrls.map((url, i) => ({ src: url, alt: `Featured visual ${i + 1}` }));
      } else if (settings.mode === "selected" && settings.templateIds?.length) {
        resolved = settings.templateIds
          .map((id) => templates.find((t) => t.id === id))
          .filter((t): t is (typeof templates)[number] => !!t)
          .map((t) => ({ src: t.cover_image_url, alt: t.name }));
      }

      if (resolved.length === 0) {
        const shuffled = [...templates].sort(() => Math.random() - 0.5);
        resolved = shuffled.slice(0, count).map((t) => ({ src: t.cover_image_url, alt: t.name }));
      }

      setImages(resolved.slice(0, count));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [count]);

  return { images, loading };
}
