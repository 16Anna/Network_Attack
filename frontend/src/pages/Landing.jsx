import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
  Network,
  LockKeyhole,
} from "lucide-react";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <ShieldCheck size={20} />
          </div>
          <span>Network<span className="logo-accent">Attack</span></span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-buttons">
          <button
            className="nav-login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="primary-btn"
            onClick={() => navigate("/register")}
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>


      {/* HERO */}
      <section className="hero">

        <div className="hero-content">

          <div className="badge">
            <span className="pulse-dot"></span>
            INTELLIGENT NETWORK SECURITY
          </div>

          <h1>
            Detect every threat.
            <br />
            <span>Protect every connection.</span>
          </h1>

          <p>
            NetworkAttack helps security teams monitor network activity,
            detect suspicious behavior and analyze cyber threats from
            one centralized platform.
          </p>

          <div className="hero-actions">

            <button
              className="primary-btn large-btn"
              onClick={() => navigate("/register")}
            >
              Start Monitoring
              <ArrowRight size={18} />
            </button>

            <button
              className="secondary-btn large-btn"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Features
            </button>

          </div>

          <div className="hero-trust">
            <div>
              <ShieldCheck size={16} />
              Real-time monitoring
            </div>

            <div>
              <LockKeyhole size={16} />
              Secure analysis
            </div>

            <div>
              <Activity size={16} />
              Live detection
            </div>
          </div>

        </div>


        {/* SECURITY VISUAL */}
        <div className="security-card">

          <div className="security-card-top">
            <div>
              <span className="mini-label">NETWORK STATUS</span>
              <h3>Security Overview</h3>
            </div>

            <div className="protected">
              <span></span>
              Protected
            </div>
          </div>


          <div className="network-map">

            <div className="connection connection-1"></div>
            <div className="connection connection-2"></div>
            <div className="connection connection-3"></div>
            <div className="connection connection-4"></div>

            <div className="network-node node-a">
              <Network size={17} />
            </div>

            <div className="network-node node-b">
              <Activity size={17} />
            </div>

            <div className="network-node node-c">
              <LockKeyhole size={17} />
            </div>

            <div className="network-node node-d">
              <ShieldCheck size={17} />
            </div>

            <div className="network-center">
              <ShieldCheck size={30} />
              <span>SECURE</span>
            </div>

          </div>


          <div className="security-metrics">

            <div>
              <strong>99.8%</strong>
              <span>Protection</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Monitoring</span>
            </div>

            <div>
              <strong>0</strong>
              <span>Critical</span>
            </div>

          </div>

        </div>

      </section>


      {/* FEATURES */}
      <section className="features-section" id="features">

        <div className="section-heading">
          <span>PLATFORM</span>
          <h2>Everything you need to secure your network</h2>
          <p>
            Monitor, detect and understand network threats from one place.
          </p>
        </div>


        <div className="feature-grid">

          <FeatureCard
            icon={<Activity />}
            title="Real-Time Monitoring"
            text="Track network traffic and system activity as it happens."
          />

          <FeatureCard
            icon={<AlertTriangle />}
            title="Attack Detection"
            text="Identify suspicious activity and potentially malicious behavior."
          />

          <FeatureCard
            icon={<Network />}
            title="Network Intelligence"
            text="Understand connections, traffic patterns and network behavior."
          />

          <FeatureCard
            icon={<ShieldCheck />}
            title="Threat Analysis"
            text="Analyze detected threats and prioritize security incidents."
          />

        </div>

      </section>


      {/* SECURITY SECTION */}
      <section className="security-section" id="security">

        <div>
          <span className="section-tag">SECURITY FIRST</span>

          <h2>
            One dashboard.
            <br />
            Complete visibility.
          </h2>

          <p>
            Get a clear view of your network health, detected attacks,
            critical alerts and traffic activity without switching
            between multiple tools.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/login")}
          >
            Open Security Dashboard
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="security-summary">

          <SummaryRow
            title="Network Health"
            value="98.4%"
            type="good"
          />

          <SummaryRow
            title="Threat Detection"
            value="24 detected"
            type="warning"
          />

          <SummaryRow
            title="Critical Alerts"
            value="03 active"
            type="danger"
          />

          <SummaryRow
            title="Traffic Analysis"
            value="1.8M packets"
            type="good"
          />

        </div>

      </section>


      <footer id="about">
        <div className="logo">
          <div className="logo-icon">
            <ShieldCheck size={18} />
          </div>
          NetworkAttack
        </div>

        <span>
          Intelligent network security and threat monitoring platform.
        </span>
      </footer>

    </div>
  );
}


function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <span className="feature-arrow">
        <ArrowRight size={16} />
      </span>

    </div>
  );
}


function SummaryRow({ title, value, type }) {
  return (
    <div className="summary-row">

      <div className={`summary-status ${type}`}></div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

    </div>
  );
}


export default Landing;