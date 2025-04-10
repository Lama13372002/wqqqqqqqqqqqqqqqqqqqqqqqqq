import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Получаем все cookies
    const cookiesList = cookies().getAll()
    const adminToken = cookies().get('admin_token')?.value
    let tokenInfo = null
    let decodedToken = null
    let adminUser = null

    // Информация о токене
    if (adminToken) {
      try {
        decodedToken = verify(adminToken, process.env.JWT_SECRET || 'default-secret-key')
        tokenInfo = {
          valid: true,
          decoded: decodedToken,
          expiresAt: decodedToken && (decodedToken as any).exp ? new Date((decodedToken as any).exp * 1000).toISOString() : null
        }

        // Получаем информацию о пользователе из базы данных
        if ((decodedToken as any).id) {
          try {
            adminUser = await prisma.adminUser.findUnique({
              where: { id: (decodedToken as any).id },
              select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
              }
            })
          } catch (dbError) {
            adminUser = { error: 'Не удалось получить данные пользователя из базы', details: (dbError as Error).message }
          }
        }
      } catch (tokenError) {
        tokenInfo = {
          valid: false,
          error: (tokenError as Error).message
        }
      }
    }

    return NextResponse.json({
      time: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        jwtSecret: process.env.JWT_SECRET ? `[Установлен, ${process.env.JWT_SECRET.length} символов]` : 'Не установлен',
        adminPassword: process.env.ADMIN_PASSWORD ? '[Установлен]' : 'Не установлен',
        databaseUrl: process.env.DATABASE_URL ? '[Установлен]' : 'Не установлен'
      },
      cookies: {
        all: cookiesList.map(c => ({ name: c.name, value: c.name === 'admin_token' ? `[${c.value.length} символов]` : c.value })),
        adminToken: adminToken ? `[Установлен, ${adminToken.length} символов]` : 'Не установлен'
      },
      authentication: {
        hasToken: !!adminToken,
        tokenInfo,
        authenticated: !!decodedToken,
        userInfo: adminUser
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Ошибка при получении отладочной информации',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      time: new Date().toISOString()
    }, { status: 500 })
  }
}
