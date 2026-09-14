import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    localStorage.setItem(
      "networkAttackUser",
      JSON.stringify({
        name,
        email,
      })
    );

    navigate("/dashboard");
  };

  return (
    <div className="auth-page">

      <div className="auth-decoration">
        <div className="auth-circle circle-one"></div>
        <div className="auth-circle circle-two"></div>
      </div>


      <div className="auth-card register-card">

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

          <h1>Create your account</h1>

          <p>
            Set up your secure network monitoring workspace.
          </p>

        </div>


        {error && (
          <div className="form-error">
            {error}
          </div>
        )}


        <form onSubmit={handleRegister}>

          <label>Full name</label>

          <div className="input-wrapper">
            <User size={17} />

            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>


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
              placeholder="Minimum 6 characters"
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


          <div className="password-check">

            <div className={password.length >= 6 ? "valid" : ""}>
              <Check size={13} />
              At least 6 characters
            </div>

          </div>


          <button className="primary-btn auth-submit" type="submit">
            Create Account
            <ArrowRight size={17} />
          </button>

        </form>


        <p className="auth-bottom">
          Already have an account?

          <button onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>

      </div>

    </div>
  );
}

export default Register;