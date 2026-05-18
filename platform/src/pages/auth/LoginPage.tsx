import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import AuthLayout from './AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'
import { onboardingApi } from '../../api/onboarding.api'
import { membersApi } from '../../api/members.api'
import { useAuthStore } from '../../stores/auth.store'
import { extractError } from '../../api/client'
import type { OrgRole } from '../../types/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setMembership = useAuthStore((s) => s.setMembership)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const login = useMutation({
    mutationFn: async () => {
      const data = await authApi.login({ email, password })
      setAuth(data.user, null, data.accessToken)
      const status = await onboardingApi.check()
      if (status.hasOrg && status.currentOrgId) {
        const list = await membersApi.list(status.currentOrgId).catch(() => [])
        const me = list.find((m) => m.userId === data.user.id)
        const role: OrgRole = me?.role ?? 'recruiter'
        setMembership({ orgId: status.currentOrgId, role })
        navigate('/')
      } else {
        navigate('/onboarding')
      }
    },
  })

  return (
    <AuthLayout>
      <h1 className="h-display text-[38px]">
        Welcome <span className="ital">back</span>.
      </h1>
      <p className="text-ink-3 mt-3.5 text-sm leading-relaxed">Sign in to your Hira workspace.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); login.mutate() }}
        className="mt-8 space-y-3.5"
      >
        <Input
          label="Work email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={14} />}
          placeholder="you@company.com"
        />
        <div className="field">
          <label className="label flex justify-between">
            Password
            <a href="#" className="text-ink-3 text-xs font-normal">Forgot password?</a>
          </label>
          <div className="input-icon-wrap relative">
            <span className="icon"><Lock size={14} /></span>
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn btn-icon-sm"
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
        {login.isError ? <div className="field-error">{extractError(login.error)}</div> : null}
        <Button type="submit" variant="primary" size="lg" className="w-full mt-5" loading={login.isPending}>
          Sign in <ArrowRight size={14} />
        </Button>
        <div className="text-ink-3 text-sm text-center mt-6">
          Don't have an account? <Link to="/register" className="text-ink underline underline-offset-2 font-medium">Register</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
