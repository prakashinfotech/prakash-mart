import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/features/auth/api/authApi'
import { ROUTES } from '@/app/router'

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      await authApi.resetPassword(token, data.newPassword, data.confirmPassword)
      navigate(ROUTES.LOGIN, { state: { message: 'Password reset successfully. Please log in.' } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg || 'Reset failed. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[460px] text-center">
          <p className="text-[28px] font-bold text-ink mb-2">Invalid reset link</p>
          <p className="text-[14px] text-muted mb-6">This link is missing or has expired.</p>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center justify-center h-[52px] px-8 bg-primary text-white font-bold text-[15px] rounded-full hover:bg-primary-dark transition-colors"
          >
            Request a new link →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Set new password
        </p>

        <h1 className="text-[40px] font-bold text-ink tracking-tight leading-none mb-2">
          Choose a <em className="italic text-primary">new</em> password.
        </h1>
        <p className="text-[14px] text-muted mb-8 leading-relaxed">
          Pick something strong — at least 8 characters.
        </p>

        {apiError && (
          <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-3 mb-5">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">New Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('newPassword')}
            />
            {errors.newPassword && <p className="text-[12px] text-error mt-1.5">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className="w-full h-[52px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-[12px] text-error mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] bg-primary text-white font-bold text-[16px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password →'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Link
          to={ROUTES.LOGIN}
          className="w-full h-[52px] flex items-center justify-center bg-[#F5F5F7] rounded-full text-[15px] font-semibold text-ink hover:bg-[#EBEBEB] transition-all"
        >
          Back to <span className="text-primary ml-1">Sign in</span>
        </Link>
      </div>
    </div>
  )
}
