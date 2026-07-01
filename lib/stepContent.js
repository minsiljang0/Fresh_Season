// 레시피 / 식재료손질처럼 "설명 + 사진"을 단계별로 보여줘야 하는 카테고리를 위한 헬퍼.
// DB 스키마를 건드리지 않고, 기존 blog_posts.content(text) 컬럼 맨 끝에
// 숨김 마커로 이미지 배열을 같이 저장해서 꺼내 쓴다.
//
// 저장 형태 (content 문자열 맨 끝):
//   ...마크다운 본문...
//
//   [[STEP_IMAGES]]["https://...","https://..."][[/STEP_IMAGES]]

const MARKER_RE = /\n*\[\[STEP_IMAGES\]\]([\s\S]*?)\[\[\/STEP_IMAGES\]\]\s*$/

/** content 문자열에서 숨김 이미지 마커를 분리해 { content, images } 로 반환 */
export function extractStepImages(content) {
  if (!content) return { content: '', images: [] }
  const m = content.match(MARKER_RE)
  if (!m) return { content, images: [] }
  let images = []
  try {
    const parsed = JSON.parse(m[1])
    if (Array.isArray(parsed)) images = parsed.filter(Boolean)
  } catch {}
  return { content: content.slice(0, m.index), images }
}

/** 순수 마크다운 본문 + 이미지 배열을 합쳐서 저장용 content 문자열로 만든다 */
export function injectStepImages(content, images) {
  const clean = (content || '').replace(MARKER_RE, '') // 기존 마커 제거 후 새로 붙임
  const safeImages = Array.isArray(images) ? images.map(s => (s || '').trim()).filter(Boolean) : []
  if (safeImages.length === 0) return clean
  return `${clean}\n\n[[STEP_IMAGES]]${JSON.stringify(safeImages)}[[/STEP_IMAGES]]`
}

/**
 * parseMarkdown()으로 변환된 HTML을 <h2> 기준으로 스텝 단위로 쪼갠다.
 * 첫 <h2> 이전 내용은 "intro"로, 그 이후는 각 <h2>가 시작하는 지점마다 새 스텝으로 나눈다.
 * 반환: { introHtml, steps: [{ html }] }
 */
export function splitStepsHtml(html) {
  if (!html) return { introHtml: '', steps: [] }
  const h2Re = /<h2[^>]*>/gi
  const positions = []
  let m
  while ((m = h2Re.exec(html)) !== null) positions.push(m.index)

  if (positions.length === 0) return { introHtml: html, steps: [] }

  const introHtml = html.slice(0, positions[0]).trim()
  const steps = positions.map((pos, i) => {
    const end = i + 1 < positions.length ? positions[i + 1] : html.length
    return { html: html.slice(pos, end).trim() }
  })
  return { introHtml, steps }
}
