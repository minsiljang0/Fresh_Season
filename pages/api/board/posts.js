import { supabase, genId } from '../../../lib/supabase'
import { createHash } from 'crypto'

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

const VALID_TYPES = ['free', 'request']

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { type, limit = 20, offset = 0 } = req.query
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: '잘못된 게시판 종류' })

    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, author_name, is_secret, created_at')
      .eq('post_type', type)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (req.method === 'POST') {
    const { type, title, author_name, password, content, is_secret } = req.body
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: '잘못된 게시판 종류' })
    if (!title || !title.trim()) return res.status(400).json({ error: '제목을 입력해주세요' })
    if (!content || !content.trim()) return res.status(400).json({ error: '내용을 입력해주세요' })
    if (!password || password.length < 4) return res.status(400).json({ error: '비밀번호는 4자 이상 입력해주세요' })

    const now = nowKST()
    const { data, error } = await supabase.from('blog_posts').insert([{
      id: genId(),
      post_type: type,
      title: title.trim(),
      slug: genId(),
      author_name: (author_name || '익명').trim() || '익명',
      password_hash: sha256(password),
      content,
      is_secret: !!is_secret,
      status: 'published',
      category: null,
      published_at: now,
      created_at: now,
      updated_at: now,
    }]).select('id, title, author_name, is_secret, created_at').single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).end()
}
