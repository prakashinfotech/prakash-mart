import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { authApi } from '@/features/auth/api/authApi'
import { ROUTES } from '@/app/router'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const successMessage = (location.state as { message?: string })?.message ?? ''
  const login = useAuthStore((s) => s.login)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const result = await authApi.login(data.email, data.password)
      login(result.user, result.token)
      navigate(ROUTES.HOME)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">

        {/* Section label */}
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Sign in to your shelf
        </p>

        {/* Heading */}
        <h1 className="text-[40px] font-bold text-ink tracking-tight leading-none mb-2">
          Welcome <em className="italic text-primary">back</em>.
        </h1>
        <p className="text-[14px] text-muted mb-8 leading-relaxed">
          Sign in to see your orders, wishlists and saved addresses.
        </p>

        {/* Alerts */}
        {successMessage && (
          <div className="bg-success/10 border border-success/30 text-success text-[13px] rounded-[12px] px-4 py-3 mb-5">
            {successMessage}
          </div>
        )}
        {apiError && (
          <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-3 mb-5">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">Mobile or email</label>
            <input
              type="email"
              placeholder="ananya@example.in or +91..."
              autoComplete="email"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[12px] text-error mt-1.5">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-ink">Password</label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-[12px] text-muted hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[12px] text-error mt-1.5">{errors.password.message}</p>
            )}
          </div>

          {/* Sign in */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] bg-primary text-white font-bold text-[16px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60 mt-1"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Secondary actions */}
        <Link
          to={ROUTES.REGISTER}
          className="w-full h-[52px] flex items-center justify-center bg-[#F5F5F7] rounded-full text-[15px] font-semibold text-ink hover:bg-[#EBEBEB] transition-all"
        >
          Create an account
        </Link>

        <p className="text-[11px] text-center text-muted mt-6">
          By continuing, you agree to our Terms &amp; Conditions
        </p>
      </div>
    </div>
  )
}
