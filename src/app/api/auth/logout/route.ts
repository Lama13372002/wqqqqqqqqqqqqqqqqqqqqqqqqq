import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // Удаляем куки с токеном
  cookies().delete('admin_token')

  return NextResponse.json({ success: true, message: 'Выход выполнен успешно' })
}
