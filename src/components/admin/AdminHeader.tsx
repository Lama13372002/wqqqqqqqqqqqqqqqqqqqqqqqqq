'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AdminHeaderProps {
  title: string;
  description?: string;
  username?: string;
}

export default function AdminHeader({ title, description, username = 'Администратор' }: AdminHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      setIsLoading(true)

      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          toast.success('Вы успешно вышли из системы')
          // Перенаправляем на страницу входа
          router.push('/adminpanelR/login')
        } else {
          throw new Error('Не удалось выйти из системы')
        }
      } catch (error) {
        console.error('Ошибка при выходе:', error)
        toast.error('Ошибка при выходе из системы')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center mr-2">
          <User className="h-4 w-4 mr-1.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{username}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          <span>Выйти</span>
        </Button>
      </div>
    </div>
  );
}
