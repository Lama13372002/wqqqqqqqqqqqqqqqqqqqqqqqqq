import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// Получаем пароль из переменных окружения или используем запасной вариант
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Secure123!'

async function main() {
  console.log('🔑 Обновление пароля администратора...')

  try {
    // Проверяем, существует ли учетная запись администратора
    const admin = await prisma.adminUser.findFirst({
      where: { username: 'admin' }
    })

    if (!admin) {
      console.log('❌ Учетная запись администратора не найдена в базе данных.')
      console.log('ℹ️ Сначала создайте учетную запись с помощью команды: bun run init-admin')
      return
    }

    // Хешируем новый пароль
    const hashedPassword = await hash(ADMIN_PASSWORD, 10)

    // Обновляем пароль в базе данных
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    })

    console.log('✅ Пароль администратора успешно обновлен!')
    console.log('ℹ️ Новый пароль взят из переменной окружения ADMIN_PASSWORD в файле .env')

  } catch (error) {
    console.error('❌ Ошибка при обновлении пароля:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
