import { Suspense } from 'react'
import UbsLoginForm from './LoginForm'

/**
 * Componente de Carregamento (Fallback)
 * * Exibido enquanto o formulário de login (que é um Client Component)
 * está sendo carregado no navegador.
 */
function LoadingState() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="bg-gray-200 rounded-lg p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded-lg"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
        <div className="h-10 bg-gray-300 rounded-lg"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  )
}

/**
 * Página Principal de Login
 * * Esta página agora é um Server Component. A única responsabilidade dela
 * é renderizar o layout e usar <Suspense> para aguardar o carregamento
 * do formulário, que precisa ser renderizado no cliente.
 */
export default function UbsLoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#fefdfb] p-4">
      <Suspense fallback={<LoadingState />}>
        <UbsLoginForm />
      </Suspense>
    </div>
  )
}
