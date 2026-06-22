export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { password } = req.body
  if (password === process.env.ADMIN_SECRET_TOKEN) {
    return res.status(200).json({ ok: true, token: process.env.ADMIN_SECRET_TOKEN })
  }
  return res.status(401).json({ error: '비밀번호 오류' })
}
