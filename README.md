# Meu Tempo

Aplicação pessoal de organização de rotinas, demandas e produtividade.

## Tecnologias
- React + Vite
- Supabase Auth e PostgreSQL
- Row Level Security no banco

## Configuração local
1. Instale Node.js LTS.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e chave publicável do projeto Supabase Meu-Tempo.
5. Execute `npm run dev`.

## Segurança
A aplicação usa apenas a chave publicável do Supabase no navegador. Nunca coloque a chave `service_role` no frontend. As tabelas devem permanecer protegidas por RLS e autenticação.

## Estado
Primeira versão: autenticação, dashboard, criação e conclusão de rotinas/demandas. Os demais módulos serão implementados nas próximas etapas.
