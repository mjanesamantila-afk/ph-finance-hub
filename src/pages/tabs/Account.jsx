import { useState } from 'react'
import { User, Loader2, Check, LogOut, Eye, EyeOff, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { BRAND } from '../../config/branding'

export default function Account() {
  const { user, signOut } = useAuth()

  const [name, setName] = useState(user?.user_metadata?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  async function saveName(e) {
    e.preventDefault()
    setNameError('')
    setNameSaved(false)
    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { name } })
      if (error) throw error
      setNameSaved(true)
    } catch (err) {
      setNameError(err.message || 'Failed to save')
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSaved(false)
    if (pw1.length < 6) {
      setPwError('Password must be at least 6 characters.')
      return
    }
    if (pw1 !== pw2) {
      setPwError('Passwords don’t match.')
      return
    }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 })
      if (error) throw error
      setPwSaved(true)
      setPw1('')
      setPw2('')
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <User size={20} className="text-slate-400" />
        <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Profile</h2>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-slate-400">Email</div>
            <div className="text-sm text-slate-800">{user?.email}</div>
          </div>

          <form onSubmit={saveName} className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingName}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingName ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : nameSaved ? (
                  <Check size={15} />
                ) : null}
                {nameSaved ? 'Saved' : 'Save name'}
              </button>
              {nameError && <span className="text-sm text-red-600">{nameError}</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Change Password</h2>

        <form onSubmit={savePassword} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">New password</span>
            <div className="relative max-w-sm">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Confirm new password</span>
            <input
              type={showPw ? 'text' : 'password'}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              autoComplete="new-password"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingPw ? (
                <Loader2 size={15} className="animate-spin" />
              ) : pwSaved ? (
                <Check size={15} />
              ) : null}
              {pwSaved ? 'Password changed' : 'Change password'}
            </button>
            {pwError && <span className="text-sm text-red-600">{pwError}</span>}
          </div>
        </form>
      </div>

      {/* Session */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Session</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign out of this device. Your data stays safely in your account.
        </p>
        <button
          onClick={signOut}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      {/* Support */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Need help?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Found a bug, have a feature idea, or need to delete your account? Send us a message.
        </p>
        <a
          href={`mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(`${BRAND.name} support`)}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          <Mail size={15} />
          Email {BRAND.supportEmail}
        </a>
      </div>
    </div>
  )
}
