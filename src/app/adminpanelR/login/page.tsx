import { Metadata } from 'next'
import { AdminLoginForm } from '@/components/forms/AdminLoginForm'

export const metadata: Metadata = {
  title: 'Вход в панель администратора',
  description: 'Авторизация для доступа к административной панели',
}

export default function AdminLoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <AdminLoginForm />
    </div>
  )
}
