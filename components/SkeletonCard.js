// 공통 스켈레톤 로딩 컴포넌트

const pulse = {
  background: 'linear-gradient(90deg, var(--border) 25%, var(--surface2) 50%, var(--border) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 8,
}

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div style={{ ...pulse, width, height, ...style }} />
}

export function SkeletonCard({ isMobile = false }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      borderRadius: isMobile ? 10 : 14, padding: isMobile ? '10px' : 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <SkeletonLine width="60%" height={isMobile ? 14 : 18} />
      <SkeletonLine width="40%" height={11} />
      <div style={{ display: 'flex', gap: 4 }}>
        <SkeletonLine width={48} height={20} style={{ borderRadius: 999 }} />
        <SkeletonLine width={48} height={20} style={{ borderRadius: 999 }} />
        <SkeletonLine width={48} height={20} style={{ borderRadius: 999 }} />
      </div>
      <SkeletonLine width="100%" height={11} />
      <SkeletonLine width="80%" height={11} />
    </div>
  )
}

export function SkeletonGrid({ count = 6, isMobile = false }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(240px,1fr))',
        gap: isMobile ? 8 : 12,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} isMobile={isMobile} />
        ))}
      </div>
    </>
  )
}

export function SkeletonBlogList({ count = 5 }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonLine width="70%" height={16} />
            <SkeletonLine width="40%" height={11} />
            <SkeletonLine width="100%" height={11} />
          </div>
        ))}
      </div>
    </>
  )
}
