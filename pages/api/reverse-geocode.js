// 위경도 → 주소 변환 (OpenStreetMap Nominatim, 무료·키 불필요)
// 클라이언트에서 직접 호출하지 않고 서버를 거치는 이유: Nominatim 이용정책상
// User-Agent로 서비스를 식별해야 해서 서버사이드에서 헤더를 붙여 프록시한다.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { lat, lng } = req.query
    if (!lat || !lng) return res.status(400).json({ error: 'lat, lng 필요' })

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko&zoom=16`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'FreshSeasonHolidayPharmacy/1.0 (https://www.fsfood.kr)' },
    })
    const data = await r.json()

    const a = data.address || {}
    const parts = [
      a.city || a.province || a.state,
      a.borough || a.county || a.city_district,
      a.town || a.suburb || a.village || a.neighbourhood,
    ].filter(Boolean)
    const label = parts.length > 0 ? parts.join(' ') : (data.display_name || '')

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).json({ label })
  } catch (e) {
    console.error('[reverse-geocode API]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
