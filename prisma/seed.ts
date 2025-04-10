import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// Генерация сложного пароля (хороший вариант запросить его из переменных окружения)
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Secure123!'

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Проверяем, есть ли уже админ
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    // Хешируем пароль для безопасности
    const hashedPassword = await hash(DEFAULT_ADMIN_PASSWORD, 10)

    // Создаем админского пользователя
    const admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        fullName: 'Администратор',
        isActive: true
      }
    })

    console.log(`👤 Создан администратор: ${admin.username}`)
  } else {
    console.log('👤 Администратор уже существует, пропускаем создание')
  }

  console.log('✅ Заполнение базы данных завершено')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
