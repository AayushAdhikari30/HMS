import './App.css'

function App() {
  return (
    <div className="screen">
      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-name">
            Medi<span>Care</span> HMS
          </div>
        </div>

        <div className="login-tagline">
          Healthcare,<br />
          <em>simplified</em>
          <br />
          for everyone.
        </div>

        <div className="login-sub">
          Secure, fast access to patient records, appointments, and care history — all in one place.
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>Welcome back</h2>
          <p>Sign in to access your portal</p>

          <div className="form-group">
            <label>Role</label>
            <select>
              <option>Select your role</option>
              <option>Patient</option>
              <option>Doctor</option>
              <option>Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Enter your username" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button className="login-btn">
            Sign in →
          </button>
        </div>
      </div>
    </div>
  )
}

export default App