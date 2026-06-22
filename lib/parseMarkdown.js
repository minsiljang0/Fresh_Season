// 간단한 마크다운 → HTML 변환 (미리보기용)
export function parseMarkdown(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1"/>')
    .replace(/^(?!<[a-z]).+$/gm, s => s.trim() ? `<p>${s}</p>` : '')
    .replace(/\n{2,}/g, '\n')
  // SVG/테이블은 raw HTML 그대로 허용
  html = html.replace(/&lt;(svg|table|thead|tbody|tr|th|td|\/svg|\/table|\/thead|\/tbody|\/tr|\/th|\/td)/gi, '<$1')
  html = html.replace(/&gt;/g, s => s)
  return html
}
