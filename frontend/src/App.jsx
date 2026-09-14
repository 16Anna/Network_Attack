import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("networkUser")) || null
  );

  const [loginMode, setLoginMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [monitoring, setMonitoring] = useState(false);
  const [stats, setStats] = useState({
    packets: 128420,
    threats: 24,
    blocked: 17,
    activeConnections: 86,
  });

  const [alerts, setAlerts] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [traffic, setTraffic] = useState(null);
  const [threatResult, setThreatResult] = useState(null);
  const [target, setTarget] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  };

  const loadDashboard = async () => {
    try {
      const data = await request("/dashboard");

      setMonitoring(data.monitoring);
      setStats(data.stats);
      setAlerts(data.alerts);
    } catch (error) {
      setMessage("Backend connection failed");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        loginMode === "login" ? "/auth/login" : "/auth/register";

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });

      localStorage.setItem("networkUser", JSON.stringify(data.user));
      setUser(data.user);
      setMessage(data.message);

      setForm({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("networkUser");
    setUser(null);
    setPage("dashboard");
  };

  const startMonitoring = async () => {
    try {
      const data = await request("/monitor/start", {
        method: "POST",
      });

      setMonitoring(data.monitoring);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const stopMonitoring = async () => {
    try {
      const data = await request("/monitor/stop", {
        method: "POST",
      });

      setMonitoring(data.monitoring);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const runScan = async () => {
    setLoading(true);

    try {
      const data = await request("/scan", {
        method: "POST",
      });

      setScanResults(data.detected);
      setStats((previous) => ({
        ...previous,
        threats: previous.threats + data.detected.length,
      }));
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTraffic = async () => {
    setLoading(true);

    try {
      const data = await request("/traffic/analyze", {
        method: "POST",
      });

      setTraffic(data.traffic);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchThreat = async () => {
    if (!target.trim()) {
      setMessage("Enter an IP address or domain first");
      return;
    }

    setLoading(true);

    try {
      const data = await request("/threat-intel", {
        method: "POST",
        body: JSON.stringify({ target }),
      });

      setThreatResult(data.result);
      setMessage(`Threat intelligence loaded for ${target}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      const data = await request(`/alerts/${id}/resolve`, {
        method: "POST",
      });

      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === id ? data.alert : alert
        )
      );

      setMessage("Alert resolved successfully");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const generateReport = async () => {
    setLoading(true);

    try {
      const data = await request("/reports", {
        method: "POST",
      });

      setReport(data.report);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AuthScreen
        mode={loginMode}
        setMode={setLoginMode}
        form={form}
        setForm={setForm}
        submit={handleAuth}
        loading={loading}
        message={message}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        logout={logout}
        user={user}
      />

      <main className="main-content">
        <Topbar
          page={page}
          user={user}
          monitoring={monitoring}
        />

        {message && (
          <div className="toast-message">
            <span>✓</span>
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {page === "dashboard" && (
          <Dashboard
            stats={stats}
            monitoring={monitoring}
            setPage={setPage}
            startMonitoring={startMonitoring}
            stopMonitoring={stopMonitoring}
            runScan={runScan}
          />
        )}

        {page === "monitor" && (
          <Monitor
            monitoring={monitoring}
            startMonitoring={startMonitoring}
            stopMonitoring={stopMonitoring}
            loadDashboard={loadDashboard}
          />
        )}

        {page === "attacks" && (
          <Attacks
            scanResults={scanResults}
            runScan={runScan}
            loading={loading}
          />
        )}

        {page === "traffic" && (
          <Traffic
            traffic={traffic}
            analyzeTraffic={analyzeTraffic}
            loading={loading}
          />
        )}

        {page === "intelligence" && (
          <ThreatIntelligence
            target={target}
            setTarget={setTarget}
            searchThreat={searchThreat}
            threatResult={threatResult}
            loading={loading}
          />
        )}

        {page === "alerts" && (
          <Alerts
            alerts={alerts}
            resolveAlert={resolveAlert}
          />
        )}

        {page === "reports" && (
          <Reports
            report={report}
            generateReport={generateReport}
            loading={loading}
          />
        )}

        {page === "settings" && <Settings user={user} />}
      </main>
    </div>
  );
}

function AuthScreen({
  mode,
  setMode,
  form,
  setForm,
  submit,
  loading,
  message,
}) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="visual-content">
          <div className="brand-large">
            <div className="brand-icon">N</div>
            <span>Network<span>Attack</span></span>
          </div>

          <div className="network-art">
            <div className="radar-circle">
              <div className="radar-line"></div>
              <div className="radar-dot dot-one"></div>
              <div className="radar-dot dot-two"></div>
              <div className="radar-dot dot-three"></div>
            </div>
          </div>

          <h1>Network Security<br />Made Smarter.</h1>
          <p>
            Monitor your network, detect suspicious activity and
            investigate threats from one powerful security dashboard.
          </p>

          <div className="security-points">
            <span>✓ Real-time monitoring</span>
            <span>✓ Threat detection</span>
            <span>✓ Security analytics</span>
          </div>
        </div>
      </div>

      <div className="auth-form-area">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-icon">N</div>
            <strong>NetworkAttack</strong>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">SECURITY OPERATIONS</p>
            <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p>
              {mode === "login"
                ? "Sign in to access your security dashboard."
                : "Create your account to start monitoring your network."}
            </p>
          </div>

          {message && <div className="auth-message">{message}</div>}

          <form onSubmit={submit}>
            {mode === "register" && (
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </label>
            )}

            <label>
              Email Address
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </label>

            <button className="primary-button full-button" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </div>

          <p className="demo-note">
            Demo application • Network Security Platform
          </p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, logout, user }) {
  const items = [
    ["dashboard", "⌂", "Dashboard"],
    ["monitor", "◉", "Network Monitor"],
    ["attacks", "⌁", "Attack Detection"],
    ["traffic", "▥", "Traffic Analysis"],
    ["intelligence", "◎", "Threat Intelligence"],
    ["alerts", "!", "Alerts"],
    ["reports", "▤", "Reports"],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">N</div>
        <div>
          <strong>Network</strong>
          <span>Attack</span>
        </div>
      </div>

      <div className="nav-label">SECURITY CENTER</div>

      <nav>
        {items.map(([id, icon, name]) => (
          <button
            key={id}
            className={page === id ? "nav-item active" : "nav-item"}
            onClick={() => setPage(id)}
          >
            <span className="nav-icon">{icon}</span>
            <span>{name}</span>
            {id === "alerts" && (
              <small className="alert-count">3</small>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={page === "settings" ? "nav-item active" : "nav-item"}
          onClick={() => setPage("settings")}
        >
          <span className="nav-icon">⚙</span>
          Settings
        </button>

        <div className="user-box">
          <div className="avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>Security Analyst</span>
          </div>
        </div>

        <button className="logout-button" onClick={logout}>
          ↪ Sign Out
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page, user, monitoring }) {
  const titles = {
    dashboard: ["Security Overview", "Monitor your network security posture"],
    monitor: ["Network Monitor", "Real-time network activity monitoring"],
    attacks: ["Attack Detection", "Identify and investigate suspicious activity"],
    traffic: ["Traffic Analysis", "Analyze network traffic patterns"],
    intelligence: ["Threat Intelligence", "Investigate IP addresses and domains"],
    alerts: ["Security Alerts", "Review and manage detected threats"],
    reports: ["Security Reports", "Generate and review security reports"],
    settings: ["Settings", "Manage your security platform"],
  };

  return (
    <header className="topbar">
      <div>
        <h1>{titles[page][0]}</h1>
        <p>{titles[page][1]}</p>
      </div>

      <div className="topbar-right">
        <div className="system-status">
          <span className={monitoring ? "status-dot online" : "status-dot"}></span>
          {monitoring ? "Monitoring Active" : "Monitoring Offline"}
        </div>

        <div className="top-avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  stats,
  monitoring,
  setPage,
  startMonitoring,
  stopMonitoring,
  runScan,
}) {
  return (
    <section>
      <div className="welcome-banner">
        <div>
          <p className="eyebrow">SECURITY COMMAND CENTER</p>
          <h2>Network security at a glance</h2>
          <p>
            Monitor activity, detect threats and respond to security
            events from one place.
          </p>
        </div>

        <div className="banner-status">
          <span className={monitoring ? "pulse active" : "pulse"}></span>
          <div>
            <strong>{monitoring ? "Protected" : "Monitoring Paused"}</strong>
            <span>
              {monitoring
                ? "Network monitoring is active"
                : "Start monitoring to begin"}
            </span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          title="Packets Analyzed"
          value={stats.packets.toLocaleString()}
          change="+12.4%"
          icon="⇄"
        />
        <StatCard
          title="Threats Detected"
          value={stats.threats}
          change="+8 today"
          icon="!"
          danger
        />
        <StatCard
          title="Threats Blocked"
          value={stats.blocked}
          change="71% blocked"
          icon="✓"
        />
        <StatCard
          title="Active Connections"
          value={stats.activeConnections}
          change="Normal"
          icon="◉"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <PanelHeader
            title="Quick Actions"
            subtitle="Start a security operation"
          />

          <div className="quick-actions">
            <button onClick={monitoring ? stopMonitoring : startMonitoring}>
              <span className="action-icon">◉</span>
              <div>
                <strong>
                  {monitoring ? "Stop Monitoring" : "Start Monitoring"}
                </strong>
                <span>
                  {monitoring
                    ? "Pause network monitoring"
                    : "Begin network monitoring"}
                </span>
              </div>
            </button>

            <button onClick={() => setPage("attacks")}>
              <span className="action-icon">⌁</span>
              <div>
                <strong>Attack Scan</strong>
                <span>Scan for suspicious activity</span>
              </div>
            </button>

            <button onClick={() => setPage("traffic")}>
              <span className="action-icon">▥</span>
              <div>
                <strong>Analyze Traffic</strong>
                <span>Inspect network traffic</span>
              </div>
            </button>

            <button onClick={runScan}>
              <span className="action-icon">✓</span>
              <div>
                <strong>Run Security Scan</strong>
                <span>Detect potential threats</span>
              </div>
            </button>
          </div>
        </div>

        <div className="panel">
          <PanelHeader
            title="Security Health"
            subtitle="Current network posture"
          />

          <div className="health-score">
            <div className="score-ring">
              <strong>86</strong>
              <span>/100</span>
            </div>

            <div className="health-info">
              <strong>Good Security Posture</strong>
              <p>Your network is currently operating normally.</p>

              <div className="health-line">
                <span>Network Security</span>
                <b>86%</b>
              </div>

              <div className="progress">
                <span style={{ width: "86%" }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <PanelHeader
          title="Network Activity"
          subtitle="Traffic overview for the last 24 hours"
          action="View Analytics"
          onAction={() => setPage("traffic")}
        />

        <div className="activity-chart">
          {[42, 55, 48, 68, 58, 75, 64, 82, 70, 88, 76, 94, 80, 68, 84, 72, 91, 79, 86, 74].map(
            (height, index) => (
              <div className="chart-column" key={index}>
                <span style={{ height: `${height}%` }}></span>
              </div>
            )
          )}
        </div>

        <div className="chart-labels">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, change, icon, danger }) {
  return (
    <div className="stat-card">
      <div className={danger ? "stat-icon danger" : "stat-icon"}>
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      {action && (
        <button className="text-button" onClick={onAction}>
          {action} →
        </button>
      )}
    </div>
  );
}

function Monitor({
  monitoring,
  startMonitoring,
  stopMonitoring,
  loadDashboard,
}) {
  return (
    <div className="page-content">
      <div className="operation-card">
        <div className="operation-icon">◉</div>

        <div>
          <p className="eyebrow">NETWORK MONITOR</p>
          <h2>
            {monitoring
              ? "Network monitoring is active"
              : "Network monitoring is stopped"}
          </h2>
          <p>
            {monitoring
              ? "The system is actively monitoring network traffic."
              : "Start monitoring to begin collecting network activity."}
          </p>
        </div>

        <div className="operation-buttons">
          {!monitoring ? (
            <button className="primary-button" onClick={startMonitoring}>
              Start Monitoring
            </button>
          ) : (
            <button className="danger-button" onClick={stopMonitoring}>
              Stop Monitoring
            </button>
          )}

          <button className="secondary-button" onClick={loadDashboard}>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="info-grid">
        <InfoBox title="Packets" value="128,420" detail="Processed today" />
        <InfoBox title="Connections" value="86" detail="Currently active" />
        <InfoBox title="Bandwidth" value="64.8 Mbps" detail="Current traffic" />
      </div>

      <div className="panel">
        <PanelHeader
          title="Live Network Activity"
          subtitle="Simulated monitoring stream"
        />

        <div className="live-list">
          {[
            ["TCP", "192.168.1.24 → 10.0.0.2", "443", "Normal"],
            ["UDP", "192.168.1.31 → 8.8.8.8", "53", "Normal"],
            ["TCP", "10.0.0.8 → 172.16.0.4", "22", "Review"],
            ["HTTPS", "192.168.1.18 → Cloud", "443", "Normal"],
          ].map((item, index) => (
            <div className="live-row" key={index}>
              <b>{item[0]}</b>
              <span>{item[1]}</span>
              <span>{item[2]}</span>
              <em>{item[3]}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, value, detail }) {
  return (
    <div className="info-box">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Attacks({ scanResults, runScan, loading }) {
  return (
    <div className="page-content">
      <div className="operation-card attack-card">
        <div className="operation-icon">⌁</div>

        <div>
          <p className="eyebrow">ATTACK DETECTION ENGINE</p>
          <h2>Detect suspicious network activity</h2>
          <p>
            Run a security scan to identify potential attacks and
            abnormal behavior.
          </p>
        </div>

        <button className="primary-button" onClick={runScan}>
          {loading ? "Scanning..." : "Run Attack Scan"}
        </button>
      </div>

      {scanResults.length > 0 ? (
        <div className="panel">
          <PanelHeader
            title="Detected Activity"
            subtitle={`${scanResults.length} potential threats found`}
          />

          <div className="result-list">
            {scanResults.map((item, index) => (
              <div className="result-row" key={index}>
                <div className="result-main">
                  <strong>{item.type}</strong>
                  <span>
                    {item.source} → {item.destination}
                  </span>
                </div>

                <span
                  className={`severity ${item.severity.toLowerCase()}`}
                >
                  {item.severity}
                </span>

                <span className="confidence">
                  {item.confidence} confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon="✓"
          title="No scan has been performed"
          text="Run an attack scan to analyze the current network."
        />
      )}
    </div>
  );
}

function Traffic({ traffic, analyzeTraffic, loading }) {
  return (
    <div className="page-content">
      <div className="operation-card">
        <div className="operation-icon">▥</div>

        <div>
          <p className="eyebrow">TRAFFIC ANALYSIS</p>
          <h2>Understand your network traffic</h2>
          <p>
            Analyze packet volume, protocols and suspicious traffic
            patterns.
          </p>
        </div>

        <button className="primary-button" onClick={analyzeTraffic}>
          {loading ? "Analyzing..." : "Analyze Traffic"}
        </button>
      </div>

      {traffic ? (
        <>
          <div className="info-grid">
            <InfoBox
              title="Total Packets"
              value={traffic.totalPackets.toLocaleString()}
              detail="Analyzed"
            />
            <InfoBox
              title="Incoming"
              value={traffic.incoming.toLocaleString()}
              detail="Packets"
            />
            <InfoBox
              title="Outgoing"
              value={traffic.outgoing.toLocaleString()}
              detail="Packets"
            />
            <InfoBox
              title="Suspicious"
              value={traffic.suspicious.toLocaleString()}
              detail="Need review"
            />
          </div>

          <div className="panel">
            <PanelHeader
              title="Protocol Distribution"
              subtitle="Network traffic by protocol"
            />

            <div className="protocol-bars">
              <Protocol name="TCP" value={traffic.tcp} />
              <Protocol name="UDP" value={traffic.udp} />
              <Protocol name="ICMP" value={traffic.icmp} />
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon="▥"
          title="Traffic analysis ready"
          text="Click Analyze Traffic to process the current network activity."
        />
      )}
    </div>
  );
}

function Protocol({ name, value }) {
  return (
    <div className="protocol">
      <div>
        <strong>{name}</strong>
        <span>{value}%</span>
      </div>
      <div className="progress">
        <span style={{ width: `${value}%` }}></span>
      </div>
    </div>
  );
}

function ThreatIntelligence({
  target,
  setTarget,
  searchThreat,
  threatResult,
  loading,
}) {
  return (
    <div className="page-content">
      <div className="panel intelligence-search">
        <p className="eyebrow">THREAT INTELLIGENCE</p>
        <h2>Investigate an IP address or domain</h2>
        <p>
          Search a target to check its reputation and potential threat
          indicators.
        </p>

        <div className="search-box">
          <input
            placeholder="Example: 192.168.1.45 or example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchThreat()}
          />

          <button className="primary-button" onClick={searchThreat}>
            {loading ? "Searching..." : "Investigate"}
          </button>
        </div>
      </div>

      {threatResult && (
        <div className="panel">
          <PanelHeader
            title="Investigation Result"
            subtitle={`Analysis for ${target}`}
          />

          <div className="threat-result">
            <div className="risk-score">
              <strong>{threatResult.riskScore}</strong>
              <span>Risk Score</span>
            </div>

            <div className="threat-details">
              <ResultDetail
                label="Reputation"
                value={threatResult.reputation}
              />
              <ResultDetail
                label="Category"
                value={threatResult.category}
              />
              <ResultDetail
                label="Country"
                value={threatResult.country}
              />
              <ResultDetail
                label="Reports"
                value={threatResult.reports}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultDetail({ label, value }) {
  return (
    <div className="result-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Alerts({ alerts, resolveAlert }) {
  return (
    <div className="page-content">
      <div className="panel">
        <PanelHeader
          title="Security Alerts"
          subtitle="Review detected security events"
        />

        <div className="alerts-list">
          {alerts.map((alert) => (
            <div className="alert-row" key={alert.id}>
              <div className={`alert-symbol ${alert.severity.toLowerCase()}`}>
                !
              </div>

              <div className="alert-content">
                <strong>{alert.type}</strong>
                <span>
                  Source: {alert.source} • {alert.time}
                </span>
              </div>

              <span className={`severity ${alert.severity.toLowerCase()}`}>
                {alert.severity}
              </span>

              <span
                className={
                  alert.status === "Resolved"
                    ? "alert-status resolved"
                    : "alert-status"
                }
              >
                {alert.status}
              </span>

              {alert.status !== "Resolved" && (
                <button
                  className="resolve-button"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reports({ report, generateReport, loading }) {
  return (
    <div className="page-content">
      <div className="operation-card">
        <div className="operation-icon">▤</div>

        <div>
          <p className="eyebrow">SECURITY REPORTING</p>
          <h2>Generate a security report</h2>
          <p>
            Create a summary of network activity, threats and blocked
            attacks.
          </p>
        </div>

        <button className="primary-button" onClick={generateReport}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {report && (
        <div className="panel report-preview">
          <div className="report-title">
            <div>
              <p className="eyebrow">NETWORK SECURITY REPORT</p>
              <h2>Security Assessment</h2>
            </div>
            <span className="report-id">{report.id}</span>
          </div>

          <div className="info-grid">
            <InfoBox
              title="Packets Analyzed"
              value={report.packets.toLocaleString()}
              detail="Network activity"
            />
            <InfoBox
              title="Threats"
              value={report.threats}
              detail="Detected"
            />
            <InfoBox
              title="Blocked"
              value={report.blocked}
              detail="Threats blocked"
            />
          </div>

          <div className="report-footer">
            <span>Generated: {report.generatedAt}</span>
            <strong>✓ {report.status}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function Settings({ user }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="page-content">
      <div className="panel settings-panel">
        <p className="eyebrow">ACCOUNT SETTINGS</p>
        <h2>Platform preferences</h2>
        <p>Manage your NetworkAttack account settings.</p>

        <div className="settings-section">
          <label>
            Account Name
            <input value={user.name} readOnly />
          </label>

          <label>
            Email
            <input value={user.email} readOnly />
          </label>

          <label className="toggle-row">
            <div>
              <strong>Security notifications</strong>
              <span>Receive alerts when threats are detected.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </label>

          <label className="toggle-row">
            <div>
              <strong>Automatic monitoring</strong>
              <span>Start monitoring when you enter the dashboard.</span>
            </div>
            <input type="checkbox" />
          </label>

          <button
            className="primary-button"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
          >
            {saved ? "✓ Settings Saved" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default App;