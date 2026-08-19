import { useState, useEffect } from 'react'
import { User, Mail, Shield, Check, Plus, Trash2, MapPin, Star, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { authApi } from '@/features/auth/api/authApi'
import { addressApi, type AddressDto, type CreateAddressDto } from '@/features/address/api/addressApi'

const EMPTY_ADDRESS: CreateAddressDto = {
  label: 'Home', fullName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '',
}

const INPUT_CLS = 'w-full h-[48px] bg-[#F5F5F7] border border-transparent rounded-[14px] px-4 text-[14px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
const LABEL_CLS = 'block text-[13px] font-semibold text-ink mb-2'

export default function UserProfilePage() {
  const { user, login } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const [addresses, setAddresses] = useState<AddressDto[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddr, setNewAddr] = useState<CreateAddressDto>(EMPTY_ADDRESS)
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrError, setAddrError] = useState('')

  useEffect(() => {
    addressApi.getAll().then(setAddresses).catch(() => {})
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwSuccess(false)
    if (!pwCurrent.trim()) { setPwError('Enter your current password.'); return }
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      await authApi.changePassword(pwCurrent, pwNew, pwConfirm)
      setPwSuccess(true)
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPwError(msg || 'Failed to change password. Please try again.')
    } finally { setPwSaving(false) }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setProfileError('Name cannot be empty.'); return }
    setSaving(true); setProfileError(''); setProfileSuccess(false)
    try {
      const result = await authApi.updateProfile(name.trim())
      login(result.user, result.token)
      setProfileSuccess(true)
    } catch { setProfileError('Failed to update profile.') }
    finally { setSaving(false) }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const { fullName, phone, addressLine, city, state, postalCode } = newAddr
    if (!fullName.trim() || !addressLine.trim() || !city.trim() || !state.trim()) {
      setAddrError('Please fill all address fields.'); return
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setAddrError('Mobile number must be exactly 10 digits.'); return
    }
    if (!/^\d{6}$/.test(postalCode.trim())) {
      setAddrError('Pincode must be exactly 6 digits.'); return
    }
    setAddrSaving(true); setAddrError('')
    try {
      const added = await addressApi.add(newAddr)
      setAddresses((prev) => [...prev, added])
      setShowAddForm(false)
      setNewAddr(EMPTY_ADDRESS)
    } catch { setAddrError('Failed to save address.') }
    finally { setAddrSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    await addressApi.delete(id).catch(() => {})
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    await addressApi.setDefault(id).catch(() => {})
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }

  if (!user) return null

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        Account settings
      </p>
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-6">
        Your <em className="italic text-primary">profile</em>.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile card */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-[22px] font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[17px] font-bold text-ink">{user.name}</p>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">{user.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F5F5F7] rounded-[12px]">
                <Mail size={14} className="text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Email</p>
                  <p className="text-[13px] text-ink font-medium truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F5F5F7] rounded-[12px]">
                <Shield size={14} className="text-muted shrink-0" />
                <div>
                  <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Role</p>
                  <p className="text-[13px] text-ink font-medium">{user.role}</p>
                </div>
              </div>
            </div>

            <h2 className="text-[13px] font-bold text-ink mb-3 flex items-center gap-2">
              <User size={14} className="text-primary" /> Edit Display Name
            </h2>

            {profileSuccess && (
              <div className="flex items-center gap-2 bg-success/10 border border-success/30 text-success text-[13px] rounded-[12px] px-4 py-2.5 mb-3">
                <Check size={14} /> Profile updated successfully.
              </div>
            )}
            {profileError && (
              <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-2.5 mb-3">{profileError}</div>
            )}

            <form onSubmit={handleSaveProfile} className="flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className={INPUT_CLS + ' flex-1'}
              />
              <button
                type="submit"
                disabled={saving}
                className="px-5 h-[48px] bg-primary text-white font-semibold text-[14px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60 shrink-0"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>

          {/* Change Password card */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4 flex items-center gap-2">
              <Lock size={14} className="text-primary" /> Change Password
            </h2>

            {pwSuccess && (
              <div className="flex items-center gap-2 bg-success/10 border border-success/30 text-success text-[13px] rounded-[12px] px-4 py-2.5 mb-4">
                <Check size={14} /> Password changed successfully.
              </div>
            )}
            {pwError && (
              <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-2.5 mb-4">{pwError}</div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              {(['current', 'new', 'confirm'] as const).map((field) => {
                const labels = { current: 'Current Password', new: 'New Password', confirm: 'Confirm New Password' }
                const placeholders = { current: 'Enter current password', new: 'At least 8 characters', confirm: 'Re-enter new password' }
                const values = { current: pwCurrent, new: pwNew, confirm: pwConfirm }
                const setters = { current: setPwCurrent, new: setPwNew, confirm: setPwConfirm }
                return (
                  <div key={field}>
                    <label className={LABEL_CLS}>{labels[field]}</label>
                    <div className="relative">
                      <input
                        type={showPw[field] ? 'text' : 'password'}
                        placeholder={placeholders[field]}
                        autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                        value={values[field]}
                        onChange={(e) => setters[field](e.target.value)}
                        className={INPUT_CLS + ' pr-11'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                      >
                        {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )
              })}
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full h-[48px] bg-primary text-white font-bold text-[14px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {pwSaving ? 'Updating...' : 'Update Password →'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: addresses */}
        <div>
          <div className="bg-white border border-border rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-ink flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Saved Addresses
              </h2>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/5 transition-colors"
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            {addresses.length === 0 && !showAddForm && (
              <p className="text-[13px] text-muted text-center py-6">No saved addresses yet.</p>
            )}

            <div className="space-y-3">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className={`border rounded-[12px] p-3 text-[13px] ${a.isDefault ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-ink">{a.label}</span>
                        {a.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase">Default</span>
                        )}
                      </div>
                      <p className="text-ink">{a.fullName} · {a.phone}</p>
                      <p className="text-muted mt-0.5 text-[12px]">{a.addressLine}, {a.city}, {a.state} — {a.postalCode}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {!a.isDefault && (
                        <button onClick={() => handleSetDefault(a.id)}
                          className="p-1.5 text-muted hover:text-warning rounded-lg hover:bg-warning/10 transition-colors" title="Set as default">
                          <Star size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showAddForm && (
              <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-[13px] font-semibold text-ink">New Address</p>
                {addrError && (
                  <div className="bg-error/10 border border-error/30 text-error text-[12px] rounded-[10px] px-3 py-2">{addrError}</div>
                )}
                <div>
                  <label className={LABEL_CLS}>Label</label>
                  <select
                    value={newAddr.label}
                    onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                    className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink outline-none focus:bg-white focus:border-primary transition-all"
                  >
                    {['Home', 'Work', 'Other'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Full Name</label>
                  <input
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    placeholder="Full name"
                    className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Address Line</label>
                  <input
                    value={newAddr.addressLine}
                    onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                    placeholder="Street address"
                    className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Mobile Number</label>
                  <input
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                  />
                  {newAddr.phone && !/^\d{10}$/.test(newAddr.phone) && (
                    <p className="text-[11px] text-error mt-1">Must be exactly 10 digits</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLS}>City</label>
                    <input
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      placeholder="City"
                      className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>State</label>
                    <input
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      placeholder="State"
                      className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Pincode</label>
                  <input
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    className="w-full h-[44px] bg-[#F5F5F7] border border-transparent rounded-[12px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all"
                  />
                  {newAddr.postalCode && !/^\d{6}$/.test(newAddr.postalCode) && (
                    <p className="text-[11px] text-error mt-1">Must be exactly 6 digits</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addrSaving}
                    className="flex-1 h-[44px] bg-primary text-white font-semibold text-[13px] rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {addrSaving ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddrError('') }}
                    className="px-4 h-[44px] border border-border text-ink text-[13px] font-semibold rounded-full hover:border-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
