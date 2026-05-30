import Link from 'next/link'
import { callFastApi } from '@/lib/api/fastapi'
import { deleteFamilyHistory } from '@/app/actions/family-history'

type FamilyHistory = {
  id: string
  member: string
  disease: string
  diagnosed_age: number | null
  notes: string | null
  created_at: string
}

const MEMBER_LABELS: Record<string, string> = {
  self: '본인',
  father: '부',
  mother: '모',
  sibling: '형제자매',
  grandparent: '조부모',
  other: '기타',
}

const headerClass = ['bg-white border-b border-gray-100', 'px-4 py-4'].join(' ')
const cardClass = ['bg-white rounded-2xl', 'border border-gray-100 p-5'].join(' ')
const deleteButtonClass = [
  'text-xs text-red-500',
  'px-3 py-1.5 rounded-lg',
  'hover:bg-red-50 transition-colors',
].join(' ')

export default async function FamilyHistoryPage() {
  const res = await callFastApi<FamilyHistory[]>('/users/me/family-histories')
  const items = res.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClass}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">가족력 관리</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            홈으로
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-3">
        {items.length === 0 && (
          <div className={cardClass}>
            <p className="text-sm text-gray-500">등록된 가족력이 없습니다.</p>
          </div>
        )}

        {items.map((fh) => (
          <div key={fh.id} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {MEMBER_LABELS[fh.member] ?? fh.member} · {fh.disease}
                </p>
                {fh.diagnosed_age != null && (
                  <p className="text-xs text-gray-500 mt-1">진단 나이: {fh.diagnosed_age}세</p>
                )}
                {fh.notes && <p className="text-xs text-gray-500 mt-1">{fh.notes}</p>}
              </div>
              <form action={deleteFamilyHistory}>
                <input type="hidden" name="id" value={fh.id} />
                <button type="submit" className={deleteButtonClass}>
                  삭제
                </button>
              </form>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
