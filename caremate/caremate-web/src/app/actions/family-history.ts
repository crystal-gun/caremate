'use server'

import { revalidatePath } from 'next/cache'
import { callFastApi } from '@/lib/api/fastapi'

export async function deleteFamilyHistory(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  // DELETE는 본인 행만 (백엔드에서 user_id 강제). 204 응답.
  await callFastApi(`/users/me/family-histories/${id}`, { method: 'DELETE' })
  revalidatePath('/family-history')
}
