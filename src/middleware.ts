import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

// Функция для проверки, имеет ли пользователь доступ к админ-маршрутам
const isAuthenticated = (req: NextRequest) => {
  // Получаем токен из cookies
  const token = req.cookies.get('admin_token')?.value

  if (!token) return false

  try {
    // Проверяем токен на валидность
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-key')
    return decoded && (decoded as any).role === 'admin'
  } catch (e) {
    return false
  }
}

// Middleware для обработки запросов перед их передачей в маршруты
export async function middleware(req: NextRequest) {
  // Путь запроса
  const path = req.nextUrl.pathname

  // Блокируем доступ только к /admin и его подмаршрутам, но не блокируем /adminpanelR
  if (path.startsWith('/admin') && !path.startsWith('/adminpanelR')) {
    // Возвращаем 404 ошибку (страница не найдена)
    return new NextResponse(null, { status: 404 })
  }

  // Проверяем, является ли путь админским (кроме страницы входа)
  if (path.startsWith('/adminpanelR') && !path.startsWith('/adminpanelR/login')) {
    // Проверяем, авторизован ли пользователь
    if (!isAuthenticated(req)) {
      // Если не авторизован, перенаправляем на страницу входа
      const url = new URL('/adminpanelR/login', req.url)
      // Сохраняем URL, на который пытался попасть пользователь
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }
  }

  // Если не требуется специальная обработка, продолжаем обычный запрос
  return NextResponse.next()
}

// Конфигурация для указания, для каких маршрутов применять middleware
export const config = {
  matcher: ['/admin/:path*', '/adminpanelR/:path*'],
}
