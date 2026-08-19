import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { authApi } from '@/features/auth/api/authApi'
import { ROUTES } from '@/app/router'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const result = await authApi.register(data.name, data.email, data.password, data.confirmPassword)
      login(result.user, result.token)
      navigate(ROUTES.HOME)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">

        {/* Section label */}
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Create your account
        </p>

        {/* Heading */}
        <h1 className="text-[40px] font-bold text-ink tracking-tight leading-none mb-2">
          Join <em className="italic text-primary">PrakashMart</em>.
        </h1>
        <p className="text-[14px] text-muted mb-8 leading-relaxed">
          Sign up to start shopping, track orders and save your wishlist.
        </p>

        {/* Error */}
        {apiError && (
          <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-3 mb-5">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              autoComplete="name"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-[12px] text-error mt-1.5">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
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
            <label className="block text-[13px] font-semibold text-ink mb-2">Password</label>
            <input
              type="password"
              placeholder="Create a password (min 8 chars)"
              autoComplete="new-password"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[12px] text-error mt-1.5">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-[12px] text-error mt-1.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] bg-primary text-white font-bold text-[16px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60 mt-1"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account →'}
          </button>

          <p className="text-[11px] text-center text-muted">
            By continuing, you agree to our Terms &amp; Conditions
          </p>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Sign in link */}
        <Link
          to={ROUTES.LOGIN}
          className="w-full h-[52px] flex items-center justify-center border-2 border-border rounded-full text-[15px] font-semibold text-ink hover:border-ink transition-all"
        >
          Already have an account? <span className="text-primary ml-1">Sign in</span>
        </Link>
      </div>
    </div>
  )
}
