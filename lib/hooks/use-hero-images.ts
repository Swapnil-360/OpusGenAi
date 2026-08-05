"use client";

import { useEffect, useState } from "react";
import { selectPublic } from "@/lib/supabase/public-rest";

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
      let settingsRows: { value: HeroSettings }[] = [];
      let templates: { id: string; name: string; cover_image_url: string }[] = [];
      try {
        [settingsRows, templates] = await Promise.all([
          selectPublic<{ value: HeroSettings }>("site_settings", "select=value&id=eq.hero_images"),
          selectPublic<{ id: string; name: string; cover_image_url: string }>(
            "templates",
            "select=id,name,cover_image_url&cover_image_url=not.is.null"
          ),
        ]);
      } catch (err) {
        // Leave the orbit empty rather than hanging on a spinner forever —
        // it's decorative, so a failure here must not stall the hero.
        if (cancelled) return;
        console.error("Failed to load hero images:", err);
        setLoading(false);
        return;
      }
      if (cancelled) return;

      const settings = (settingsRows[0]?.value ?? { mode: "random" }) as HeroSettings;

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
