import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Lock, Mail, User } from 'lucide-react'
import AuthLayout from './AuthLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { extractError } from '../../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const register = useMutation({
    mutationFn: async () => {
      const data = await authApi.register({ email, password, fullName })
      setAuth(data.user, null, data.accessToken)
      navigate('/onboarding')
    },
  })

  return (
    <AuthLayout>
      <h1 className="h-display text-[38px]">Create your <span className="ital">account</span>.</h1>
      <p className="text-ink-3 mt-3.5 text-sm leading-relaxed">Get started free. You'll set up an organization next.</p>
      <form onSubmit={(e) => { e.preventDefault(); register.mutate() }} className="mt-8 space-y-3">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required leftIcon={<User size={14} />} placeholder="Ahmad Nairat" />
        <Input label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required leftIcon={<Mail size={14} />} placeholder="you@company.com" />
        <Input label="Password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required leftIcon={<Lock size={14} />} placeholder="At least 8 characters" />
        {register.isError ? <div className="field-error">{extractError(register.error)}</div> : null}
        <Button type="submit" variant="primary" size="lg" className="w-full mt-5" loading={register.isPending}>
          Create account <ArrowRight size={14} />
        </Button>
        <div className="text-ink-4 text-xs text-center leading-relaxed mt-4">
          By creating an account, you agree to our <a href="#" className="text-ink-2 underline">Terms</a> and <a href="#" className="text-ink-2 underline">Privacy Policy</a>.
        </div>
        <div className="text-ink-3 text-sm text-center mt-5">
          Already have an account? <Link to="/login" className="text-ink underline underline-offset-2 font-medium">Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
