-- Default score rules — cloned per-user on signup (see actions/auth.actions.ts)
-- key                 | label                          | points
-- sem_site             Empresa não possui site          +80
-- sem_instagram         Instagram inexistente            +25
-- poucas_avaliacoes     Poucas avaliações (<10)          +15
-- nota_baixa            Nota do Google abaixo de 4        +20
-- sem_fotos             Sem fotos no perfil               +15
-- sem_email             Sem e-mail cadastrado             +15
-- sem_whatsapp          Sem WhatsApp                      +10
-- site_antigo           Site desatualizado (heurística)   +30

insert into score_rules (user_id, key, label, points) values
  ('00000000-0000-0000-0000-000000000000', 'sem_site', 'Empresa não possui site', 80),
  ('00000000-0000-0000-0000-000000000000', 'sem_instagram', 'Instagram inexistente', 25),
  ('00000000-0000-0000-0000-000000000000', 'poucas_avaliacoes', 'Poucas avaliações (<10)', 15),
  ('00000000-0000-0000-0000-000000000000', 'nota_baixa', 'Nota do Google abaixo de 4', 20),
  ('00000000-0000-0000-0000-000000000000', 'sem_fotos', 'Sem fotos no perfil', 15),
  ('00000000-0000-0000-0000-000000000000', 'sem_email', 'Sem e-mail cadastrado', 15),
  ('00000000-0000-0000-0000-000000000000', 'sem_whatsapp', 'Sem WhatsApp', 10),
  ('00000000-0000-0000-0000-000000000000', 'site_antigo', 'Site desatualizado (heurística)', 30);
