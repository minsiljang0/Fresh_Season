import { createContext, useContext, useEffect, useState } from 'react'

// 광고 슬롯 설정을 앱 전체에서 한 번만 불러와 공유하기 위한 컨텍스트
const AdSlotsContext = createContext({ slots: {}, loading: true })

export function AdSlotsProvider({ children }) {
  const [slots, setSlots] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/get')
      .then(r => (r.ok ? r.json() : {}))
      .then(data => {
        const list = Array.isArray(data.adSlots) ? data.adSlots : []
        const map = {}
        list.forEach(s => { map[s.id] = s })
        setSlots(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdSlotsContext.Provider value={{ slots, loading }}>
      {children}
    </AdSlotsContext.Provider>
  )
}

// 특정 슬롯 하나의 데이터만 필요할 때 사용 (예: useAdSlot('home_top'))
export function useAdSlot(id) {
  const { slots } = useContext(AdSlotsContext)
  return slots[id] || null
}

// 전체 슬롯 맵과 로딩 상태가 필요할 때 사용
export function useAdSlots() {
  return useContext(AdSlotsContext)
}
