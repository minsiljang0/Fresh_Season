// Fresh Season 관리자 공용 스타일 & UI 컴포넌트
// 라이트 테마 (화이트+그린)
export const S = {
  card: { background: '#ffffff', border: '1px solid #d1e8d1', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(22,163,74,0.06)' },
  cardTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#0f1f0f' },
  input: {
    background: '#f5f9f5', border: '1px solid #d1e8d1', borderRadius: 8,
    padding: '10px 14px', color: '#0f1f0f', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    background: '#f5f9f5', border: '1px solid #d1e8d1', borderRadius: 8,
    padding: '10px 14px', color: '#0f1f0f', fontFamily: 'monospace',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
    resize: 'vertical', lineHeight: 1.7,
  },
  btn: (color = '#16a34a') => ({
    background: color, color: '#fff', border: 'none', borderRadius: 9,
    padding: '10px 22px', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  }),
  btnGhost: {
    background: 'none', color: '#4b6e4b', border: '1px solid #d1e8d1', borderRadius: 9,
    padding: '10px 22px', fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  label: { color: '#4b6e4b', fontSize: 12, marginBottom: 5, display: 'block', fontWeight: 600 },
  row: { background: '#f5f9f5', border: '1px solid #d1e8d1', borderRadius: 10, padding: '12px 16px', marginBottom: 8 },
}

export function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 50, height: 28, borderRadius: 14,
      background: value ? '#16a34a' : '#d1e8d1',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        position: 'absolute', top: 3, left: value ? 25 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

export function ConfirmModal({ open, title, message, confirmLabel = '삭제', cancelLabel = '취소', danger = true, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,31,15,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: '1px solid #d1e8d1',
        }}
      >
        {title && <div style={{ fontSize: 16, fontWeight: 700, color: '#0f1f0f', marginBottom: 8 }}>{title}</div>}
        {message && <div style={{ fontSize: 13, color: '#4b6e4b', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={S.btnGhost}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{
              ...S.btn(danger ? '#dc2626' : '#16a34a'),
              padding: '10px 22px',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.5)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', fontFamily:"'Outfit',sans-serif", overflow:'hidden' }}>
        <div style={{ padding:'28px 24px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#111', marginBottom:8 }}>정말 삭제할까요?</div>
          <div style={{ fontSize:13, background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:8,
            padding:'10px 16px', color:'#dc2626', fontWeight:700, marginBottom:6 }}>
            "{item.name}"
          </div>
          <div style={{ fontSize:11, color:'#aaa' }}>삭제하면 복구할 수 없어요</div>
        </div>
        <div style={{ display:'flex', borderTop:'1px solid #f0f0f0' }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#f5f9f5', color:'#4b6e4b',
              fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              borderRight:'1px solid #f0f0f0' }}>취소</button>
          <button onClick={() => { onConfirm(); onCancel() }}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#fee2e2', color:'#dc2626',
              fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', border: '1px solid #d1e8d1', borderRadius: 10,
      padding: '12px 22px', fontSize: 14, color: '#0f1f0f', zIndex: 999,
      boxShadow: '0 8px 24px rgba(22,163,74,0.15)',
    }}>{msg}</div>
  )
}
