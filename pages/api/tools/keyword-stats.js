import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_SECRET_TOKEN) return res.status(401).json({ error: '인증 필요' })

  // ?mode=today → 오늘 실시간 조회 기록 반환
  if (req.query.mode === 'today') {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { data, error } = await supabase
        .from('keyword_stats')
        .select('hint, keyword, pc, mobile, total, competition, doc_count, created_at')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)

      // 찜 목록 조회 (picked 표시용)
      const { data: picks } = await supabase.from('keyword_picks').select('tool_id, keyword')
      const pickedSet = new Set((picks || []).map(p => `${p.tool_id}:${p.keyword}`))

      const rows = (data || []).map(r => ({
        ...r,
        picked: pickedSet.has(`${r.hint}:${r.keyword}`),
      }))
      return res.status(200).json(rows)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  try {
    // hint별 키워드 수, 최근 수집일, null doc_count 수 집계
    const { data, error } = await supabase
      .from('keyword_stats')
      .select('hint, keyword, doc_count, created_at')

    if (error) throw new Error(error.message)

    const grouped = {}
    for (const row of data || []) {
      if (!grouped[row.hint]) grouped[row.hint] = { hint: row.hint, count: 0, null_doc_count: 0, collected_at: null }
      grouped[row.hint].count++
      if (row.doc_count == null) grouped[row.hint].null_doc_count++
      if (!grouped[row.hint].collected_at || row.created_at > grouped[row.hint].collected_at) {
        grouped[row.hint].collected_at = row.created_at
      }
    }

    return res.status(200).json(Object.values(grouped).sort((a, b) => a.hint.localeCompare(b.hint, 'ko')))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
