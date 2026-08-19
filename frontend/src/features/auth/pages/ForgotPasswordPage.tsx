import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { authApi } from '@/features/auth/api/authApi'
import { ROUTES } from '@/app/router'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      setApiError('Something went wrong. Please try again.')
    }
  }

  /* ── Success state ─────────────────────────────────────────── */
  if (sent) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px] text-center">
          <div className="text-[48px] mb-4">📧</div>
          <h2 className="text-[28px] font-bold text-ink mb-2">Check your inbox</h2>
          <p className="text-[14px] text-muted mb-8 leading-relaxed">
            If an account with that email exists, a password reset link has been sent.
            The link expires in 1 hour.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center justify-center h-[52px] px-8 bg-primary text-white font-bold text-[15px] rounded-full hover:bg-primary-dark transition-colors"
          >
            Back to Sign in
          </Link>
        </div>
      </div>
    )
  }

  /* ── Form ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">

        {/* Section label */}
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Reset your password
        </p>

        {/* Heading */}
        <h1 className="text-[40px] font-bold text-ink tracking-tight leading-none mb-2">
          Forgot your <em className="italic text-primary">password?</em>
        </h1>
        <p className="text-[14px] text-muted mb-8 leading-relaxed">
          Enter your registered email and we'll send you a reset link.
        </p>

        {/* Error */}
        {apiError && (
          <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-3 mb-5">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">
              Registered Email Address
            </label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] bg-primary text-white font-bold text-[16px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link →'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Back to login */}
        <Link
          to={ROUTES.LOGIN}
          className="w-full h-[52px] flex items-center justify-center bg-[#F5F5F7] rounded-full text-[15px] font-semibold text-ink hover:bg-[#EBEBEB] transition-all"
        >
          Remember your password? <span className="text-primary ml-1">Sign in</span>
        </Link>
      </div>
    </div>
  )
}
