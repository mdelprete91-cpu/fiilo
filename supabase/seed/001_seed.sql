-- ============================================================
-- SEED DATA — Dati demo realistici
-- ============================================================
-- Eseguire DOPO le migration.
-- Crea: 2 sartorie, clienti, abiti, catalogo tessuti.
-- Gli utenti auth vengono creati tramite la dashboard Supabase
-- (Authentication → Users → Invite user).
-- ============================================================

-- ── Tenants ──────────────────────────────────────────────────

INSERT INTO public.tenants (id, name, slug, brand_color, email, phone, city, plan)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Sartoria Belmonte', 'belmonte',
   '#C9A84C', 'info@sartoriabelmonte.it', '+39 081 5551234', 'Napoli', 'professional'),
  ('22222222-0000-0000-0000-000000000001', 'Atelier Roma', 'atelier-roma',
   '#2C3E50', 'info@atelierroma.it', '+39 06 3332211', 'Roma', 'starter')
ON CONFLICT (id) DO NOTHING;

-- ── Clienti Sartoria Belmonte ─────────────────────────────

INSERT INTO public.clients (id, tenant_id, first_name, last_name, email, phone, city, date_of_birth, notes)
VALUES
  ('c1000001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Marco', 'Esposito', 'marco.esposito@email.it', '+39 333 1111111', 'Napoli',
   '1985-03-15', 'Cliente storico. Preferisce taglio napoletano classico.'),
  ('c1000001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'Antonio', 'De Luca', 'antonio.deluca@gmail.com', '+39 340 2222222', 'Caserta',
   '1978-07-22', 'Corporatura atletica. Spalle larghe.'),
  ('c1000001-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'Giuseppe', 'Ferrara', 'g.ferrara@libero.it', '+39 347 3333333', 'Salerno',
   '1990-11-08', 'Preferisce tessuti leggeri. Lavora in banca.'),
  ('c1000001-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'Luigi', 'Romano', 'luigi.romano@pec.it', '+39 338 4444444', 'Napoli',
   '1965-05-30', 'Avvocato. Abiti formali scuri.'),
  ('c1000001-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
   'Francesco', 'Marino', 'f.marino@outlook.com', '+39 320 5555555', 'Benevento',
   '1992-09-14', null)
ON CONFLICT (id) DO NOTHING;

-- ── Clienti Atelier Roma ──────────────────────────────────

INSERT INTO public.clients (id, tenant_id, first_name, last_name, email, phone, city, date_of_birth, notes)
VALUES
  ('c2000002-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'Roberto', 'Conti', 'r.conti@studiolegale.it', '+39 335 6666666', 'Roma',
   '1972-02-18', 'Magistrato. Abiti seri, toni scuri.'),
  ('c2000002-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
   'Stefano', 'Ricci', 'stefano.ricci@gmail.com', '+39 342 7777777', 'Roma',
   '1988-06-25', 'Architetto. Apprezza design moderno.'),
  ('c2000002-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001',
   'Andrea', 'Moretti', 'andrea.moretti@azienda.com', '+39 328 8888888', 'Milano',
   '1980-12-03', 'Viaggia spesso. Tessuti resistenti alle pieghe.'),
  ('c2000002-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001',
   'Matteo', 'Ferrari', 'm.ferrari@consulente.it', '+39 331 9999999', 'Roma',
   '1994-04-17', null),
  ('c2000002-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001',
   'Luca', 'Bianchi', 'luca.bianchi@email.com', '+39 329 0000000', 'Roma',
   '1987-08-29', 'Prima visita. Matrimonio a settembre.')
ON CONFLICT (id) DO NOTHING;

-- ── Catalogo tessuti — Sartoria Belmonte ─────────────────

INSERT INTO public.fabrics (tenant_id, name, mill, code, composition, weight_grams, color, pattern, price_per_meter, season, is_available)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Super 150s Navy Chalk Stripe',
   'Loro Piana', 'LP-4521', '100% Lana Vergine Super 150s', 280, 'Blu Navy',
   'striped', 380.00, 'all_season', true),
  ('11111111-0000-0000-0000-000000000001', 'Charcoal Herringbone Classic',
   'Vitale Barberis Canonico', 'VBC-8834', '100% Lana Vergine', 310, 'Grigio Antracite',
   'herringbone', 220.00, 'autumn_winter', true),
  ('11111111-0000-0000-0000-000000000001', 'Mid Grey Windowpane',
   'Drago', 'DR-2267', '100% Lana Super 130s', 250, 'Grigio Medio',
   'windowpane', 195.00, 'all_season', true),
  ('11111111-0000-0000-0000-000000000001', 'Camel Cashmere Blend',
   'Loro Piana', 'LP-9103', '70% Lana, 30% Cashmere', 340, 'Cammello',
   'solid', 520.00, 'autumn_winter', true),
  ('11111111-0000-0000-0000-000000000001', 'Ice Blue Fresco',
   'Ermenegildo Zegna', 'EZ-1155', '100% Lana Tropical', 200, 'Azzurro Ghiaccio',
   'solid', 290.00, 'spring_summer', true),
  ('11111111-0000-0000-0000-000000000001', 'Prince of Wales Check',
   'Holland & Sherry', 'HS-7741', '100% Lana Super 120s', 270, 'Grigio/Marrone',
   'checked', 310.00, 'autumn_winter', true),
  ('11111111-0000-0000-0000-000000000001', 'Midnight Blue Mohair',
   'Scabal', 'SC-4489', '80% Lana, 20% Mohair', 230, 'Blu Notte',
   'solid', 340.00, 'all_season', true),
  ('11111111-0000-0000-0000-000000000001', 'Tan Linen Summer',
   'Solbiati', 'SB-3301', '100% Lino', 190, 'Sabbia',
   'solid', 145.00, 'spring_summer', true),
  ('11111111-0000-0000-0000-000000000001', 'Dark Brown Houndstooth',
   'Vitale Barberis Canonico', 'VBC-5512', '100% Lana Super 100s', 295, 'Marrone Scuro',
   'houndstooth', 185.00, 'autumn_winter', true),
  ('11111111-0000-0000-0000-000000000001', 'Ivory Silk Blend',
   'Cerruti', 'CE-8823', '70% Lana, 30% Seta', 220, 'Avorio',
   'solid', 420.00, 'spring_summer', true)
ON CONFLICT DO NOTHING;

-- ── Bottoni — Sartoria Belmonte ───────────────────────────

INSERT INTO public.buttons (tenant_id, name, material, color, finish)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Corno Buffalo Naturale', 'horn', 'Marrone naturale', 'naturale'),
  ('11111111-0000-0000-0000-000000000001', 'Corozo Avorio', 'corozo', 'Avorio', 'lucido'),
  ('11111111-0000-0000-0000-000000000001', 'Madreperla Bianca', 'mother_of_pearl', 'Bianco madreperlaceo', 'lucido'),
  ('11111111-0000-0000-0000-000000000001', 'Corno Scuro Smoked', 'horn', 'Marrone scuro', 'opaco')
ON CONFLICT DO NOTHING;

-- ── Fodere — Sartoria Belmonte ────────────────────────────

INSERT INTO public.linings (tenant_id, name, color, material)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Bemberg Classic Bordeaux', 'Bordeaux', 'Bemberg'),
  ('11111111-0000-0000-0000-000000000001', 'Bemberg Navy Rigato', 'Blu Navy a righe', 'Bemberg'),
  ('11111111-0000-0000-0000-000000000001', 'Seta Naturale Avorio', 'Avorio', 'Seta'),
  ('11111111-0000-0000-0000-000000000001', 'Flash Paesley Rosso', 'Rosso con paesley', 'Bemberg')
ON CONFLICT DO NOTHING;

-- ── Colori filo — Sartoria Belmonte ──────────────────────

INSERT INTO public.thread_colors (tenant_id, name, hex_color)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Rosso Belmonte', '#C0392B'),
  ('11111111-0000-0000-0000-000000000001', 'Blu Reale', '#2471A3'),
  ('11111111-0000-0000-0000-000000000001', 'Bianco', '#FDFEFE'),
  ('11111111-0000-0000-0000-000000000001', 'Oro', '#D4AC0D'),
  ('11111111-0000-0000-0000-000000000001', 'Arancio', '#E67E22')
ON CONFLICT DO NOTHING;
