import { supabase } from '../../lib/supabase'

// 연령별 건강 가이드(영양소/이슈/검진) 데이터를 DB에서 읽어와
// 프론트가 바로 쓰기 좋은 형태로 묶어서 내려주는 공개 API (인증 불필요, 읽기 전용)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const [
      groupsRes, nutrientsRes, issuesRes, checkupHlRes,
      checkupCommonRes, cancerRes, sourcesRes, metaRes, schoolMealRes,
    ] = await Promise.all([
      supabase.from('age_health_groups').select('*').order('sort_order'),
      supabase.from('age_health_nutrients').select('*').order('age_group_id').order('sort_order'),
      supabase.from('age_health_issues').select('*').order('age_group_id').order('sort_order'),
      supabase.from('age_health_checkup_highlights').select('*').order('age_group_id').order('sort_order'),
      supabase.from('age_health_checkup_common').select('*').order('sort_order'),
      supabase.from('age_health_cancer_screening').select('*').order('sort_order'),
      supabase.from('age_health_sources').select('*').order('sort_order'),
      supabase.from('age_health_meta').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('age_health_school_meal').select('*').order('age_group_id').order('sort_order'),
    ])

    for (const r of [groupsRes, nutrientsRes, issuesRes, checkupHlRes, checkupCommonRes, cancerRes, sourcesRes, metaRes, schoolMealRes]) {
      if (r.error) throw r.error
    }

    const groupBy = (rows) => {
      const map = {}
      ;(rows || []).forEach(r => {
        if (!map[r.age_group_id]) map[r.age_group_id] = []
        map[r.age_group_id].push({ tags: r.tags || [], text: r.body, foodCategory: r.food_category, foodLinkLabel: r.food_link_label, note: r.note })
      })
      return map
    }

    const groups = {}
    ;(groupsRes.data || []).forEach(g => {
      groups[g.id] = {
        label: g.label, range: g.age_range, emoji: g.emoji,
        kdriRange: g.kdri_range, forMeNote: g.for_me_note,
      }
    })

    const meta = metaRes.data || {}

    res.status(200).json({
      order: (groupsRes.data || []).map(g => g.id),
      groups,
      nutrients: groupBy(nutrientsRes.data),
      issues: groupBy(issuesRes.data),
      checkupHighlights: groupBy(checkupHlRes.data),
      schoolMeal: groupBy(schoolMealRes.data),
      checkupCommon: {
        title: meta.checkup_common_title || '',
        subtitle: meta.checkup_common_subtitle || '',
        note: meta.checkup_common_note || '',
        items: (checkupCommonRes.data || []).map(r => ({ tags: r.tags || [], text: r.body, foodCategory: r.food_category, foodLinkLabel: r.food_link_label, note: r.note })),
      },
      cancerScreening: {
        title: meta.cancer_screening_title || '',
        items: (cancerRes.data || []).map(r => ({
          name: r.name, target: r.target, cycle: r.cycle, method: r.method,
          foodCategory: r.food_category, foodLinkLabel: r.food_link_label, note: r.note,
        })),
      },
      sources: (sourcesRes.data || []).map(s => ({ label: s.label, url: s.url })),
      lastVerified: meta.last_verified_label || '',
    })
  } catch (e) {
    console.error('[health-guide API]', e.message)
    res.status(500).json({ error: e.message })
  }
}
