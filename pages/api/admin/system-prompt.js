/**
 * pages/api/admin/system-prompt.js
 * Claude 프로젝트 지침(시스템 프롬프트) 조회 / 저장
 *
 * GET  → 현재 저장된 지침 반환 (인증 불필요 — MCP에서 호출)
 * POST → 지침 덮어쓰기 저장   (admin 인증 필요)
 *
 * id 파라미터로 탭(5종) 구분:
 *   - 'claude'    : 🤖 클로드 탭
 *   - 'main'      : 🛠️ 2-1 블로그 글작성지침 (기존 데이터, 하위호환을 위해 id는 그대로 'main' 유지)
 *   - 'main2'     : 🛠️ 2-2 블로그 글작성지침
 *   - 'month'     : 🗓️ 월글감 탭
 *   - 'reference' : 📎 글쓰기 참고자료(스와이프 파일) — 규칙이 아니라 참고용 예시 모음
 * id가 없거나 위 5개가 아니면 'main'으로 처리한다.
 *
 * Supabase 테이블 (최초 1회 생성):
 *   create table if not exists system_prompts (
 *     id         text primary key default 'main',
 *     content    text not null default '',
 *     updated_at timestamptz not null
 *   );
 *   insert into system_prompts (id, content, updated_at)
 *   values ('main', '', now())
 *   on conflict (id) do nothing;
 *
 *   -- 탭 추가 시 (한 번만):
 *   insert into system_prompts (id, content, updated_at)
 *   values ('claude', '', now()), ('month', '', now())
 *   on conflict (id) do nothing;
 *
 *   -- 2-2 탭 추가 시 (한 번만):
 *   insert into system_prompts (id, content, updated_at)
 *   values ('main2', '', now())
 *   on conflict (id) do nothing;
 *
 *   -- 4️⃣ 글쓰기 참고자료 탭 추가 시 (한 번만):
 *   insert into system_prompts (id, content, updated_at)
 *   values ('reference', '', now())
 *   on conflict (id) do nothing;
 */

import { createClient } from '@supabase/supabase-js'

const VALID_IDS = ['claude', 'main', 'main2', 'month', 'reference', 'rss_sources']

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

function resolveId(raw) {
  return VALID_IDS.includes(raw) ? raw : 'main'
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const id = resolveId(req.query.id)

    const { data, error } = await supabase
      .from('system_prompts')
      .select('content, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(200).json({ content: '', updated_at: '' })
    return res.status(200).json({ content: data.content, updated_at: data.updated_at })
  }

  if (req.method === 'POST') {
    const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
    if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

    const { content } = req.body || {}
    const id = resolveId(req.body?.id)
    if (typeof content !== 'string') return res.status(400).json({ error: 'content 필드 필요' })

    const { error } = await supabase
      .from('system_prompts')
      .upsert({ id, content, updated_at: nowKST() }, { onConflict: 'id' })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
