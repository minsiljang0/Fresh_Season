import { createContext, useContext, useEffect, useState } from 'react'

// 광고 슬롯 설정 + 쿠팡 배너/위젯 목록을 앱 전체에서 한 번만 불러와 공유하기 위한 컨텍스트
const AdSlotsContext = createContext({ slots: {}, coupangWidgets: [], loading: true })

export function AdSlotsProvider({ children }) {
  const [slots, setSlots] = useState({})
  const [coupangWidgets, setCoupangWidgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/get').then(r => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch('/api/admin/coupang-widgets').then(r => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([data, widgets]) => {
        const list = Array.isArray(data.adSlots) ? data.adSlots : []
        const map = {}
        list.forEach(s => { map[s.id] = s })
        setSlots(map)
        setCoupangWidgets(Array.isArray(widgets) ? widgets : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdSlotsContext.Provider value={{ slots, coupangWidgets, loading }}>
      {children}
    </AdSlotsContext.Provider>
  )
}

// 특정 슬롯 하나의 데이터만 필요할 때 사용 (예: useAdSlot('home_top'))
export function useAdSlot(id) {
  const { slots } = useContext(AdSlotsContext)
  return slots[id] || null
}

// 쿠팡 배너/위젯 목록이 필요할 때 사용
export function useCoupangWidgets() {
  const { coupangWidgets } = useContext(AdSlotsContext)
  return coupangWidgets
}

// 전체 슬롯 맵과 로딩 상태가 필요할 때 사용
export function useAdSlots() {
  return useContext(AdSlotsContext)
}
