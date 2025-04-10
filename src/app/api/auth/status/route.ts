import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

export async function GET() {
  try {
    // Получаем токен из куки
    const token = cookies().get('admin_token')?.value

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'Токен отсутствует',
        debug: {
          hasToken: false,
          tokenLength: 0
        }
      })
    }

    // Проверяем токен
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-key')

      // Если токен действителен
      if (decoded) {
        return NextResponse.json({
          authenticated: true,
          message: 'Токен действителен',
          user: {
            username: (decoded as any).username,
            role: (decoded as any).role
          },
          debug: {
            hasToken: true,
            tokenLength: token.length,
            tokenExpiry: (decoded as any).exp ? new Date((decoded as any).exp * 1000).toISOString() : 'Unknown',
            decodedInfo: {
              id: (decoded as any).id,
              role: (decoded as any).role,
              iat: (decoded as any).iat,
              exp: (decoded as any).exp
            }
          }
        })
      }
    } catch (verifyError) {
      // Если ошибка верификации токена
      return NextResponse.json({
        authenticated: false,
        message: 'Токен недействителен',
        error: (verifyError as Error).message,
        debug: {
          hasToken: true,
          tokenLength: token.length,
          errorType: verifyError instanceof Error ? verifyError.constructor.name : 'Unknown Error'
        }
      })
    }

    return NextResponse.json({
      authenticated: false,
      message: 'Неизвестная ошибка верификации',
      debug: {
        hasToken: true,
        tokenLength: token.length
      }
    })
  } catch (error) {
    // Если общая ошибка
    return NextResponse.json({
      authenticated: false,
      message: 'Ошибка проверки аутентификации',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown Error'
      }
    })
  }
}
