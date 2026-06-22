import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_SECRET_TOKEN) return res.status(401).json({ error: '인증 필요' })

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
