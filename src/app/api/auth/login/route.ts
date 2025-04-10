import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { compare } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import prisma from '@/lib/prisma'

// Время жизни токена - 1 день
const JWT_EXPIRY = 60 * 60 * 24

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Проверяем обязательные поля
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      )
    }

    // Получаем данные о пользователе из БД
    const user = await prisma.adminUser.findUnique({
      where: { username },
    })

    // Если пользователь не найден
    if (!user) {
      // Для безопасности не сообщаем, что конкретно неверно
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    const passwordValid = await compare(password, user.passwordHash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      )
    }

    // Создаем JWT токен
    const token = sign(
      {
        id: user.id,
        username: user.username,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'default-secret-key', // Лучше использовать сложный секретный ключ из env
      { expiresIn: JWT_EXPIRY }
    )

    // Устанавливаем куки с токеном
    cookies().set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: JWT_EXPIRY,
      path: '/'
    })

    // Обновляем информацию о последнем входе
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    return NextResponse.json({ success: true, message: 'Авторизация успешна' })
  } catch (error) {
    console.error('Ошибка авторизации:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера при авторизации' },
      { status: 500 }
    )
  }
}
