// 레시피/식재료손질 글의 자유 마크다운 본문에서 Recipe schema.org(JSON-LD)용
// recipeIngredient · recipeInstructions를 최대한 안전하게 뽑아낸다.
//
// 전제(지금 글쓰기 관행): 본문에 "**재료(...)**: 재료1, 재료2, ..." 줄이 있고,
// 그 바로 다음부터 다음 "## " 섹션 전까지 "1. **단계명**: 설명" 형태의 번호 목록이 이어진다.
// 이 패턴에 맞지 않으면 null을 반환한다 — 애매한 데이터를 억지로 만들어 구글에
// 잘못된 구조화 데이터를 제출하는 것보다, 아예 안 넣는 편이 안전하다.

const INGREDIENT_LINE_RE = /\*\*\s*재료[^*]*\*\*\s*[:：]\s*(.+)/
const STEP_LINE_RE = /^\d+\.\s*(.+)$/gm

function stripMarkdown(s) {
  return (s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

export function extractRecipeData(markdown) {
  if (!markdown) return null

  const ingredientMatch = markdown.match(INGREDIENT_LINE_RE)
  if (!ingredientMatch) return null

  const ingredients = ingredientMatch[1]
    .split(/[,，]/)
    .map(stripMarkdown)
    .filter(Boolean)
  if (ingredients.length === 0) return null

  // 재료 줄 다음부터 다음 "## " 섹션(효능·주의사항·FAQ 등) 전까지만 스텝으로 인정.
  // 본문 뒤쪽에 있는 다른 번호 목록(있다면)과 섞이지 않게 범위를 좁힌다.
  const afterIngredient = markdown.slice(ingredientMatch.index + ingredientMatch[0].length)
  const nextH2Idx = afterIngredient.search(/\n##\s/)
  const stepSection = nextH2Idx === -1 ? afterIngredient : afterIngredient.slice(0, nextH2Idx)

  const steps = []
  const stepRe = new RegExp(STEP_LINE_RE.source, STEP_LINE_RE.flags)
  let m
  while ((m = stepRe.exec(stepSection)) !== null) {
    const text = stripMarkdown(m[1])
    if (text) steps.push(text)
  }
  if (steps.length < 2) return null

  return { ingredients, steps }
}
