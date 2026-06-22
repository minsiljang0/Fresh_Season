// 계절·월별 분류
export const SEASONS = [
  { id: 'spring', name: '봄',   icon: '🌸', months: [3,4,5],    color: '#ec4899', desc: '봄나물·딸기·도다리' },
  { id: 'summer', name: '여름', icon: '☀️', months: [6,7,8],    color: '#f97316', desc: '복숭아·참외·민어' },
  { id: 'fall',   name: '가을', icon: '🍂', months: [9,10,11],  color: '#a16207', desc: '사과·배·전어·굴' },
  { id: 'winter', name: '겨울', icon: '❄️', months: [12,1,2],   color: '#3b82f6', desc: '굴·과메기·방어·딸기' },
]

export function getCurrentSeason() {
  const m = new Date().getMonth() + 1
  return SEASONS.find(s => s.months.includes(m)) || SEASONS[0]
}

export function getSeasonByMonth(month) {
  return SEASONS.find(s => s.months.includes(Number(month))) || SEASONS[0]
}
