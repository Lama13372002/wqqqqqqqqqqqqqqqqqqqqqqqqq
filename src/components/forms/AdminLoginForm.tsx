'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LockIcon, ShieldIcon, CheckCircle } from 'lucide-react'

// Схема валидации для формы входа
const formSchema = z.object({
  username: z.string().min(1, {
    message: 'Имя пользователя обязательно',
  }),
  password: z.string().min(1, {
    message: 'Пароль обязателен',
  }),
})

export function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [blockUntil, setBlockUntil] = useState<Date | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  // Проверяем, авторизован ли пользователь при загрузке страницы
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()

        if (data.authenticated) {
          // Если пользователь уже авторизован, перенаправляем на главную страницу админки
          const redirectPath = searchParams.get('redirect') || '/adminpanelR'
          console.log('Пользователь авторизован, перенаправление на:', redirectPath)

          // Показываем форму успеха перед перенаправлением
          setLoginSuccess(true)

          // Используем более прямое перенаправление с небольшой задержкой
          setTimeout(() => {
            window.location.href = redirectPath
          }, 1500)
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса авторизации:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [searchParams, router])

  // Проверяем, не заблокирован ли вход
  const isBlocked = () => {
    if (blockUntil && new Date() < blockUntil) {
      const timeLeft = Math.ceil((blockUntil.getTime() - Date.now()) / 1000 / 60)
      toast.error(`Слишком много попыток входа. Попробуйте снова через ${timeLeft} минут.`)
      return true
    }
    return false
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Проверяем блокировку
    if (isBlocked()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }

      // Сброс счетчика попыток при успешном входе
      setLoginAttempts(0)

      // Показываем сообщение об успешном входе и форму успеха
      setLoginSuccess(true)
      toast.success('Вход выполнен успешно! Перенаправление...')

      // Получаем URL для перенаправления из параметров запроса или используем страницу по умолчанию
      const redirectPath = searchParams.get('redirect') || '/adminpanelR'

      // Добавим небольшую задержку перед перенаправлением
      setTimeout(() => {
        // Используем window.location для наиболее надежного перенаправления
        window.location.href = redirectPath
      }, 2000)
    } catch (error: any) {
      // Увеличиваем счетчик неудачных попыток
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)

      // Если более 5 неудачных попыток, блокируем на 15 минут
      if (newAttempts >= 5) {
        const blockTime = new Date()
        blockTime.setMinutes(blockTime.getMinutes() + 15)
        setBlockUntil(blockTime)
        toast.error(`Слишком много попыток входа. Вход заблокирован на 15 минут.`)
      } else {
        toast.error(`Неверное имя пользователя или пароль. Осталось попыток: ${5 - newAttempts}`)
      }
    } finally {
      if (!loginSuccess) {
        setIsLoading(false)
      }
    }
  }

  // Показываем индикатор загрузки при проверке статуса авторизации
  if (isCheckingAuth) {
    return (
      <div className="mx-auto max-w-md space-y-6 p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Проверка статуса авторизации...</p>
        </div>
      </div>
    )
  }

  if (loginSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-6 p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md">
        <div className="space-y-4 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">Вход выполнен успешно!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Перенаправление в панель администратора...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-green-200 rounded w-full mx-auto mt-4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md">
      <div className="space-y-2 text-center">
        <ShieldIcon className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold">Вход в панель администратора</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Введите свои учетные данные для входа
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя пользователя</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Введите имя пользователя"
                    {...field}
                    disabled={isLoading || isBlocked()}
                    className="form-input-focus"
                    autoComplete="username"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    {...field}
                    disabled={isLoading || isBlocked()}
                    className="form-input-focus"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isBlocked()}
          >
            {isLoading ? (
              <>
                <span className="mr-2 animate-spin">&#9696;</span>
                Вход...
              </>
            ) : (
              <>
                <LockIcon className="mr-2 h-4 w-4" />
                Войти
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
