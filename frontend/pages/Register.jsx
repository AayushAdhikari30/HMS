import { useState } from 'react'
import { Link } from 'react-router-dom'

// SVG Icons (no emojis - UI/UX Pro Max rule)
const HospitalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Patient',
    phone: '',
    dob: '',
    bloodGroup: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const validateForm = () => {
    const { fullName, email, password, confirmPassword, phone, dob } = formData

    if (!fullName || !email || !password || !phone || !dob) {
      setError('All fields are required')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return

    // Disable button during submission (UI/UX Pro Max - loading-buttons rule)
    setLoading(true)
    setTimeout(() => {
      console.log(formData)
      setLoading(false)
    }, 1500)
  }

  // Reusable classes
  const inputClass = `
    w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-3
    text-white placeholder-[#444] text-sm outline-none
    focus:border-green-500 focus:ring-1 focus:ring-green-500/20
    transition-all duration-200 [color-scheme:dark]
  `
  const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2"

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between px-14 py-12 bg-[#0a0a0a] border-r border-[#1a1a1a]">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <HospitalIcon />
          <span className="text-white font-bold text-xl tracking-tight">
            Medi<span className="text-green-500">Care</span>
            <span className="text-[#555] font-normal ml-1 text-sm">HMS</span>
          </span>
        </div>

        {/* Main content */}
        <div>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
            <ShieldIcon />
            <span className="text-green-400 text-xs font-semibold tracking-wide uppercase">
              Trusted Healthcare Platform
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
            Healthcare,<br />
            <span className="text-green-500">simplified</span><br />
            for everyone.
          </h1>

          <p className="text-[#666] text-base leading-relaxed max-w-sm">
            Secure, fast access to patient records, appointments,
            and care history — all in one place.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-12">
            {[
              { value: '10k+', label: 'Patients' },
              { value: '500+', label: 'Doctors' },
              { value: '98%', label: 'Satisfaction' }
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-green-500/40 pl-4">
                <p className="text-green-500 text-2xl font-bold">{stat.value}</p>
                <p className="text-[#555] text-xs uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6">
          {['HIPAA Compliant', 'ISO 27001', '256-bit Encrypted'].map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[#555] text-xs">{badge}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── RIGHT PANEL - FORM ── */}
      <div className="w-full lg:w-[540px] flex flex-col justify-center px-8 lg:px-12 py-12 bg-[#0d0d0d]">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <HospitalIcon />
          <span className="text-white font-bold text-lg">
            Medi<span className="text-green-500">Care</span> HMS
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold tracking-tight mb-1">
            Create your account
          </h2>
          <p className="text-[#555] text-sm">
            Already have one?{' '}
            <Link
              to="/login"
              className="text-green-500 hover:text-green-400 font-medium transition-colors duration-150"
            >
              Sign in instead
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Row 1 - Name & Email */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="john@email.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Row 2 - Passwords */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Row 3 - Phone & DOB */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="phone" className={labelClass}>Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="98XXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="dob" className={labelClass}>Date of Birth</label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 4 - Blood Group & Role */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label htmlFor="bloodGroup" className={labelClass}>Blood Group</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="role" className={labelClass}>Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Error — shown near form, not just at top (UI/UX Pro Max rule) */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit — disabled during loading (UI/UX Pro Max rule) */}
          <button
            type="submit"
            disabled={loading}
            aria-label="Create account"
            className="
              w-full py-3.5 rounded-lg font-semibold text-sm
              bg-green-500/10 text-green-500 border border-green-500/40
              hover:bg-green-500 hover:text-black hover:border-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-green-500/50
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Creating account...
              </>
            ) : (
              'Create Account →'
            )}
          </button>

        </form>

        {/* Trust line at bottom */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <StarIcon />
          <p className="text-[#444] text-xs">
            Your data is encrypted and never shared
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register