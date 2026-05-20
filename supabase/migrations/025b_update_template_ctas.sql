-- ============================================================
-- 025b — Update system template CTAs to prefer fabric external_url
-- ============================================================
-- Il template "new_fabric" ora usa la variabile derivata
-- {{fabric_external_url_or_whatsapp}} che ritorna l'URL del prodotto
-- sul sito della sartoria se presente, altrimenti il link WhatsApp.
-- CTA label generalizzata.
-- ============================================================

UPDATE public.newsletter_templates
SET cta_url_template = '{{fabric_external_url_or_whatsapp}}',
    cta_label = 'Scopri il tessuto'
WHERE is_system = true AND slug = 'new_fabric';
