import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("networkAttackUser", email);

    navigate("/dashboard");
  };

  return (
    <div className="auth-page">

      <div className="auth-decoration">
        <div className="auth-circle circle-one"></div>
        <div className="auth-circle circle-two"></div>
      </div>


      <div className="auth-card">

        <button
          className="auth-logo"
          onClick={() => navigate("/")}
        >
          <div className="logo-icon">
            <ShieldCheck size={19} />
          </div>
          NetworkAttack
        </button>


        <div className="auth-heading">

          <h1>Welcome back</h1>

          <p>
            Sign in to access your security dashboard.
          </p>

        </div>


        {error && (
          <div className="form-error">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin}>

          <label>Email address</label>

          <div className="input-wrapper">
            <Mail size={17} />

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </div>


          <label>Password</label>

          <div className="input-wrapper">

            <Lock size={17} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>

          </div>


          <div className="form-options">

            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>

            <button
              type="button"
              className="forgot-btn"
              onClick={() =>
                alert("Password recovery will be connected to the backend.")
              }
            >
              Forgot password?
            </button>

          </div>


          <button className="primary-btn auth-submit" type="submit">
            Sign In
            <ArrowRight size={17} />
          </button>

        </form>


        <div className="auth-divider">
          <span>OR</span>
        </div>


        <p className="auth-bottom">
          Don't have an account?

          <button onClick={() => navigate("/register")}>
            Create account
          </button>
        </p>

      </div>

    </div>
  );
}

export default Login;