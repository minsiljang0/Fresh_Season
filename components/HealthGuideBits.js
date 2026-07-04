import Link from 'next/link'

// 뱃지(tags) + 설명(text)을 함께 보여주고, foodCategory가 있으면 그 효능의 식재료 목록 페이지로 링크
export function TaggedItem({ item, tagBg, tagBorder, tagColor }) {
  return (
    <li style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
        {item.tags.map(t => (
          <span key={t} className="tag" style={{ background: tagBg, borderColor: tagBorder, color: tagColor, fontWeight: 700 }}>{t}</span>
        ))}
      </div>
      <span>{item.text}</span>
      <FoodLink category={item.foodCategory} label={item.foodLinkLabel} />
    </li>
  )
}

export function FoodLink({ category, label }) {
  if (!category || !label) return null
  return (
    <div style={{ marginTop: 6 }}>
      <Link href={`/health/${encodeURIComponent(category)}`} style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
        🍽️ {label}
      </Link>
    </div>
  )
}
