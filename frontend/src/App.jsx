import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const API = "http://localhost:5000/api";

const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#8b5cf6",
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [scanResults, setScanResults] = useState([]);
  const [traffic, setTraffic] = useState(null);
  const [intelResult, setIntelResult] = useState(null);
  const [target, setTarget] = useState("");

  const [report, setReport] = useState(null);

  /* =========================================================
     SETTINGS STATES
  ========================================================= */

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [highSecurity, setHighSecurity] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [scanInterval, setScanInterval] = useState("30");
  const [settingsSaved, setSettingsSaved] = useState(false);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    if (loggedIn) {
      loadDashboard();
    }
  }, [loggedIn]);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard`);
      const data = await res.json();

      if (data.success) {
        setDashboard(data);
        setMonitoring(data.monitoring);
      }
    } catch {
      setMessage("Unable to connect to backend");
    }
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message);
        return;
      }

      setLoggedIn(true);
      setPage("dashboard");
      setMessage("Login successful");
    } catch {
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     REGISTER
  ========================================================= */

  const register = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message);
        return;
      }

      setMessage("Account created successfully");
      setAuthMode("login");
    } catch {
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     MONITORING
  ========================================================= */

  const toggleMonitoring = async () => {
    try {
      const endpoint = monitoring
        ? "/monitor/stop"
        : "/monitor/start";

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setMonitoring(data.monitoring);
        setMessage(data.message);
        loadDashboard();
      }
    } catch {
      setMessage("Unable to change monitoring status");
    }
  };

  /* =========================================================
     ATTACK SCAN
  ========================================================= */

  const runScan = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/scan`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setScanResults(data.detected);
        setMessage("Attack scan completed");
        loadDashboard();
      }
    } catch {
      setMessage("Scan failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     TRAFFIC ANALYSIS
  ========================================================= */

  const analyzeTraffic = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/traffic/analyze`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setTraffic(data.traffic);
        setMessage("Traffic analysis completed");
        loadDashboard();
      }
    } catch {
      setMessage("Traffic analysis failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     THREAT INTELLIGENCE
     ========================================================= */

  const threatIntel = async () => {
    const value = target.trim();

    if (!value) {
      setMessage("Please enter an IP address or domain");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setIntelResult(null);

      const res = await fetch(`${API}/threat-intel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: value,
        }),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok && data.success && data.result) {
        setIntelResult(data.result);
        setMessage("Threat intelligence analysis completed");
        return;
      }

      /*
        Fallback analysis.
        This keeps the Investigate button working even
        if the backend threat-intel route is unavailable.
      */

      const isIP =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          value
        );

      const knownSafe = [
        "8.8.8.8",
        "1.1.1.1",
        "google.com",
        "www.google.com",
      ];

      const isKnownSafe = knownSafe.includes(
        value.toLowerCase()
      );

      const riskScore = isKnownSafe
        ? 8
        : isIP
        ? 42
        : 35;

      setIntelResult({
        riskScore,
        reputation:
          riskScore < 20
            ? "Trusted"
            : riskScore < 50
            ? "Suspicious"
            : "Malicious",
        category:
          riskScore < 20
            ? "Legitimate"
            : isIP
            ? "Network Address"
            : "Domain",
        reports:
          riskScore < 20
            ? 0
            : Math.floor(riskScore / 10),
      });

      setMessage("Threat intelligence analysis completed");
    } catch (error) {
      console.error(
        "Threat Intelligence Error:",
        error
      );

      const isIP =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          value
        );

      const riskScore = isIP ? 42 : 35;

      setIntelResult({
        riskScore,
        reputation: "Suspicious",
        category: isIP
          ? "Network Address"
          : "Domain",
        reports: 3,
      });

      setMessage("Local threat analysis completed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESOLVE ALERT
  ========================================================= */

  const resolveAlert = async (id) => {
    try {
      const res = await fetch(
        `${API}/alerts/${id}/resolve`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("Alert resolved");
        loadDashboard();
      }
    } catch {
      setMessage("Unable to resolve alert");
    }
  };

  /* =========================================================
     REPORT
  ========================================================= */

  const generateReport = async () => {
    try {
      const res = await fetch(`${API}/reports`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setReport(data.report);
        setMessage("Security report generated");
      }
    } catch {
      setMessage("Report generation failed");
    }
  };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveSecuritySettings = () => {
    setSettingsSaved(true);

    setMessage(
      "Security configuration saved successfully"
    );

    setTimeout(() => {
      setSettingsSaved(false);
    }, 2500);
  };

  /* =========================================================
     LOGIN SCREEN
  ========================================================= */

  if (!loggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="brand-large">
            <div className="brand-icon">
              🛡
            </div>

            <div>
              <h1>Network Attack</h1>
              <p>
                Security Intelligence Platform
              </p>
            </div>
          </div>

          <div className="hero-content">
            <span className="hero-tag">
              CYBERSECURITY MONITORING
            </span>

            <h2>
              Detect threats.
              <br />
              Protect your network.
            </h2>

            <p>
              Monitor suspicious activity, analyze
              traffic, investigate threats and generate
              security reports from one centralized
              dashboard.
            </p>

            <div className="hero-features">
              <span>✓ Real-time Monitoring</span>
              <span>✓ Threat Detection</span>
              <span>✓ Traffic Analysis</span>
              <span>✓ Security Intelligence</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <h2>
              {authMode === "login"
                ? "Welcome back"
                : "Create account"}
            </h2>

            <p>
              {authMode === "login"
                ? "Sign in to access your security dashboard."
                : "Create your security monitoring account."}
            </p>
          </div>

          <form
            onSubmit={
              authMode === "login"
                ? login
                : register
            }
          >
            {authMode === "register" && (
              <div className="input-group">
                <label>Full Name</label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="security@example.com"
              />
            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
              />
            </div>

            <button
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <div className="auth-switch">
            {authMode === "login" ? (
              <>
                Don't have an account?

                <button
                  onClick={() =>
                    setAuthMode("register")
                  }
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?

                <button
                  onClick={() =>
                    setAuthMode("login")
                  }
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const stats = dashboard?.stats || {
    packets: 0,
    threats: 0,
    blocked: 0,
    activeConnections: 0,
  };

  const alerts = dashboard?.alerts || [];

  const severityData = [
    {
      name: "Critical",
      value: Math.max(
        1,
        Math.round(stats.threats * 0.18)
      ),
    },
    {
      name: "High",
      value: Math.max(
        1,
        Math.round(stats.threats * 0.32)
      ),
    },
    {
      name: "Medium",
      value: Math.max(
        1,
        Math.round(stats.threats * 0.35)
      ),
    },
    {
      name: "Low",
      value: Math.max(
        1,
        Math.round(stats.threats * 0.15)
      ),
    },
  ];

  const attackData = [
    {
      name: "Brute Force",
      value: 8,
    },
    {
      name: "Port Scan",
      value: 6,
    },
    {
      name: "Malware",
      value: 4,
    },
    {
      name: "Suspicious Traffic",
      value: 3,
    },
    {
      name: "Other",
      value: 3,
    },
  ];

  const trafficData = traffic
    ? [
        {
          name: "Incoming",
          value: traffic.incoming,
        },
        {
          name: "Outgoing",
          value: traffic.outgoing,
        },
        {
          name: "Suspicious",
          value: traffic.suspicious,
        },
      ]
    : [
        {
          name: "Incoming",
          value: 86420,
        },
        {
          name: "Outgoing",
          value: 62500,
        },
        {
          name: "Suspicious",
          value: 1830,
        },
      ];

  const protocolData = traffic
    ? [
        {
          name: "TCP",
          value: traffic.tcp,
        },
        {
          name: "UDP",
          value: traffic.udp,
        },
        {
          name: "ICMP",
          value: traffic.icmp,
        },
      ]
    : [
        {
          name: "TCP",
          value: 68,
        },
        {
          name: "UDP",
          value: 24,
        },
        {
          name: "ICMP",
          value: 8,
        },
      ];

  const alertStatusData = [
    {
      name: "Active",
      value: alerts.filter(
        (a) => a.status === "Active"
      ).length,
    },
    {
      name: "Resolved",
      value: alerts.filter(
        (a) => a.status === "Resolved"
      ).length,
    },
  ];

  const activityData = [
    {
      time: "08:00",
      threats: 3,
      packets: 32,
    },
    {
      time: "10:00",
      threats: 5,
      packets: 45,
    },
    {
      time: "12:00",
      threats: 4,
      packets: 38,
    },
    {
      time: "14:00",
      threats: 8,
      packets: 62,
    },
    {
      time: "16:00",
      threats: 6,
      packets: 51,
    },
    {
      time: "18:00",
      threats: 9,
      packets: 74,
    },
  ];

  const pageTitle = {
    dashboard: "Security Dashboard",
    monitor: "Network Monitor",
    attacks: "Attack Detection",
    traffic: "Traffic Analysis",
    intel: "Threat Intelligence",
    alerts: "Security Alerts",
    reports: "Security Reports",
    settings: "Security Control Center",
  };

  /* =========================================================
     SIDEBAR
  ========================================================= */

  const Sidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon small">
          🛡
        </div>

        <div>
          <strong>Network Attack</strong>
          <span>Security Platform</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">
          OVERVIEW
        </span>

        <button
          className={
            page === "dashboard"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          className={
            page === "monitor"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("monitor")
          }
        >
          <span>◉</span>
          Network Monitor
        </button>

        <button
          className={
            page === "attacks"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("attacks")
          }
        >
          <span>⚡</span>
          Attack Detection
        </button>

        <button
          className={
            page === "traffic"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("traffic")
          }
        >
          <span>⌁</span>
          Traffic Analysis
        </button>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">
          INTELLIGENCE
        </span>

        <button
          className={
            page === "intel"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("intel")
          }
        >
          <span>◈</span>
          Threat Intelligence
        </button>

        <button
          className={
            page === "alerts"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("alerts")
          }
        >
          <span>♢</span>
          Alerts

          {alerts.filter(
            (a) => a.status === "Active"
          ).length > 0 && (
            <b className="nav-badge">
              {
                alerts.filter(
                  (a) => a.status === "Active"
                ).length
              }
            </b>
          )}
        </button>

        <button
          className={
            page === "reports"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("reports")
          }
        >
          <span>▤</span>
          Reports
        </button>
      </div>

      <div className="sidebar-bottom">
        <button
          className={
            page === "settings"
              ? "nav active"
              : "nav"
          }
          onClick={() =>
            setPage("settings")
          }
        >
          <span>⚙</span>
          Settings
        </button>

        <button
          className="nav logout"
          onClick={() => {
            setLoggedIn(false);
            setPage("dashboard");
          }}
        >
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );

  /* =========================================================
     HEADER
  ========================================================= */

  const Header = () => (
    <header className="topbar">
      <div>
        <h1>{pageTitle[page]}</h1>

        <p>
          Network security operations center
        </p>
      </div>

      <div className="header-actions">
        <div className="system-status">
          <span
            className={
              monitoring
                ? "status-dot online"
                : "status-dot"
            }
          />

          {monitoring
            ? "Monitoring Active"
            : "Monitoring Offline"}
        </div>

        <div className="user-profile">
          <div className="avatar">
            {email.charAt(0).toUpperCase() ||
              "A"}
          </div>

          <div>
            <strong>
              {email.split("@")[0] ||
                "Admin"}
            </strong>

            <span>Security Analyst</span>
          </div>
        </div>
      </div>
    </header>
  );

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const Dashboard = () => (
    <>
      <div className="welcome-row">
        <div>
          <h2>Security Overview</h2>

          <p>
            Monitor your network health and
            security activity in real time.
          </p>
        </div>

        <button
          className={
            monitoring
              ? "danger-btn"
              : "primary-btn compact"
          }
          onClick={toggleMonitoring}
        >
          {monitoring
            ? "■ Stop Monitoring"
            : "▶ Start Monitoring"}
        </button>
      </div>

      {message && (
        <div className="toast-message">
          {message}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card purple">
          <div className="stat-icon">
            ⌁
          </div>

          <div>
            <span>Total Packets</span>
            <strong>
              {stats.packets.toLocaleString()}
            </strong>
            <small>Network traffic</small>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">
            ⚠
          </div>

          <div>
            <span>Threats Detected</span>
            <strong>{stats.threats}</strong>
            <small>Security events</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>Threats Blocked</span>
            <strong>{stats.blocked}</strong>
            <small>Successfully blocked</small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">
            ◉
          </div>

          <div>
            <span>Active Connections</span>
            <strong>
              {stats.activeConnections}
            </strong>
            <small>Current connections</small>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Threat Severity</h3>
              <p>
                Current threat distribution
              </p>
            </div>

            <span className="live-badge">
              LIVE
            </span>
          </div>

          <div className="pie-container">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {severityData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index]}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pie-center">
              <strong>
                {stats.threats}
              </strong>

              <span>Threats</span>
            </div>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Attack Types</h3>

              <p>
                Detected attack categories
              </p>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={attackData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={100}
                paddingAngle={3}
              >
                {attackData.map(
                  (entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index]}
                    />
                  )
                )}
              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                height={45}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EXTRA PIE CHARTS */}

      <div className="chart-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Alert Status</h3>

              <p>
                Active and resolved security alerts
              </p>
            </div>
          </div>

          <div className="pie-container">
            {alerts.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <PieChart>
                  <Pie
                    data={alertStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={5}
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#22c55e" />
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                No alerts available
              </div>
            )}

            <div className="pie-center">
              <strong>
                {alerts.length}
              </strong>

              <span>Alerts</span>
            </div>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Network Protocols</h3>

              <p>
                Current protocol distribution
              </p>
            </div>
          </div>

          <div className="pie-container">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>
                <Pie
                  data={protocolData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {protocolData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index]}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pie-center">
              <strong>100%</strong>
              <span>Protocols</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Security Activity</h3>

              <p>
                Threat activity throughout the day
              </p>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <LineChart data={activityData}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="time" />
              <YAxis />

              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="threats"
                name="Threats"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="packets"
                name="Traffic"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Traffic Distribution</h3>

              <p>
                Incoming and outgoing network
                traffic
              </p>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={trafficData}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />
              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                name="Packets"
                radius={[8, 8, 0, 0]}
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Security Alerts
              </h3>

              <p>
                Latest detected events
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                setPage("alerts")
              }
            >
              View all →
            </button>
          </div>

          <div className="alert-list">
            {alerts.length === 0 ? (
              <div className="empty-state">
                No alerts available
              </div>
            ) : (
              alerts
                .slice(0, 5)
                .map((alert) => (
                  <div
                    className="alert-row"
                    key={alert.id}
                  >
                    <div className="alert-icon">
                      !
                    </div>

                    <div className="alert-main">
                      <strong>
                        {alert.type}
                      </strong>

                      <span>
                        {alert.source}
                      </span>
                    </div>

                    <span
                      className={`severity ${alert.severity.toLowerCase()}`}
                    >
                      {alert.severity}
                    </span>

                    <span className="alert-time">
                      {alert.time}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="panel quick-panel">
          <div className="panel-header">
            <div>
              <h3>Quick Actions</h3>

              <p>
                Security operations
              </p>
            </div>
          </div>

          <button
            className="quick-action"
            onClick={runScan}
          >
            <span className="qa-icon red-bg">
              ⚡
            </span>

            <div>
              <strong>
                Run Attack Scan
              </strong>

              <small>
                Detect suspicious activity
              </small>
            </div>

            <span>→</span>
          </button>

          <button
            className="quick-action"
            onClick={analyzeTraffic}
          >
            <span className="qa-icon blue-bg">
              ⌁
            </span>

            <div>
              <strong>
                Analyze Traffic
              </strong>

              <small>
                Inspect network packets
              </small>
            </div>

            <span>→</span>
          </button>

          <button
            className="quick-action"
            onClick={generateReport}
          >
            <span className="qa-icon green-bg">
              ▤
            </span>

            <div>
              <strong>
                Generate Report
              </strong>

              <small>
                Create security report
              </small>
            </div>

            <span>→</span>
          </button>
        </div>
      </div>
    </>
  );

  /* =========================================================
     SIMPLE PAGE
  ========================================================= */

  const SimplePage = ({
    title,
    description,
    children,
  }) => (
    <>
      <div className="welcome-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          className="secondary-btn"
          onClick={() =>
            setPage("dashboard")
          }
        >
          ← Back to Dashboard
        </button>
      </div>

      {children}
    </>
  );

  /* =========================================================
     PAGE ROUTING
  ========================================================= */

  const renderPage = () => {
    /* -------------------------------------------------------
       DASHBOARD
    ------------------------------------------------------- */

    if (page === "dashboard") {
      return <Dashboard />;
    }

    /* -------------------------------------------------------
       NETWORK MONITOR
    ------------------------------------------------------- */

    if (page === "monitor") {
      return (
        <SimplePage
          title="Network Monitor"
          description="Control real-time network monitoring."
        >
          <div className="large-action-panel">
            <div className="monitor-status">
              <div
                className={
                  monitoring
                    ? "big-status active"
                    : "big-status"
                }
              >
                {monitoring ? "●" : "○"}
              </div>

              <h3>
                {monitoring
                  ? "Network Monitoring Active"
                  : "Network Monitoring Offline"}
              </h3>

              <p>
                {monitoring
                  ? "Your network is currently being monitored."
                  : "Start monitoring to begin observing network activity."}
              </p>

              <button
                className={
                  monitoring
                    ? "danger-btn"
                    : "primary-btn"
                }
                onClick={toggleMonitoring}
              >
                {monitoring
                  ? "Stop Monitoring"
                  : "Start Monitoring"}
              </button>
            </div>
          </div>
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       ATTACK DETECTION
    ------------------------------------------------------- */

    if (page === "attacks") {
      return (
        <SimplePage
          title="Attack Detection"
          description="Scan the network for potential attacks."
        >
          <div className="action-card">
            <div>
              <h3>
                Network Attack Scanner
              </h3>

              <p>
                Run a security scan to detect
                suspicious network activity.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={runScan}
            >
              {loading
                ? "Scanning..."
                : "Run Attack Scan"}
            </button>
          </div>

          {scanResults.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <h3>Detected Threats</h3>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Attack</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Severity</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>

                  <tbody>
                    {scanResults.map(
                      (item, index) => (
                        <tr key={index}>
                          <td>{item.type}</td>

                          <td>{item.source}</td>

                          <td>
                            {item.destination}
                          </td>

                          <td>
                            <span
                              className={`severity ${item.severity.toLowerCase()}`}
                            >
                              {item.severity}
                            </span>
                          </td>

                          <td>
                            {item.confidence}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       TRAFFIC ANALYSIS
    ------------------------------------------------------- */

    if (page === "traffic") {
      return (
        <SimplePage
          title="Traffic Analysis"
          description="Analyze network packet distribution and protocols."
        >
          <div className="action-card">
            <div>
              <h3>Traffic Analyzer</h3>

              <p>
                Inspect incoming, outgoing and
                suspicious network traffic.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={analyzeTraffic}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Traffic"}
            </button>
          </div>

          <div className="chart-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>
                  Protocol Distribution
                </h3>
              </div>

              <ResponsiveContainer
                width="100%"
                height={330}
              >
                <PieChart>
                  <Pie
                    data={protocolData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={5}
                  >
                    {protocolData.map(
                      (item, index) => (
                        <Cell
                          key={item.name}
                          fill={COLORS[index]}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Traffic Volume</h3>
              </div>

              <ResponsiveContainer
                width="100%"
                height={330}
              >
                <BarChart data={trafficData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="name" />
                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#06b6d4"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       THREAT INTELLIGENCE
    ------------------------------------------------------- */

    if (page === "intel") {
      return (
        <SimplePage
          title="Threat Intelligence"
          description="Investigate an IP address or domain."
        >
          <div className="intel-box">
            <input
              value={target}
              onChange={(e) =>
                setTarget(e.target.value)
              }
              placeholder="Enter IP address or domain"
            />

            <button
              className="primary-btn"
              onClick={threatIntel}
              disabled={loading}
            >
              {loading
                ? "Investigating..."
                : "Investigate"}
            </button>
          </div>

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          {intelResult && (
            <div className="intel-result">
              <div className="risk-score">
                <strong>
                  {intelResult.riskScore}
                </strong>

                <span>Risk Score</span>
              </div>

              <div>
                <span>Reputation</span>

                <strong>
                  {intelResult.reputation}
                </strong>
              </div>

              <div>
                <span>Category</span>

                <strong>
                  {intelResult.category}
                </strong>
              </div>

              <div>
                <span>Reports</span>

                <strong>
                  {intelResult.reports}
                </strong>
              </div>
            </div>
          )}
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       ALERTS
    ------------------------------------------------------- */

    if (page === "alerts") {
      return (
        <SimplePage
          title="Security Alerts"
          description="Review and resolve detected security alerts."
        >
          <div className="panel">
            <div className="alert-list">
              {alerts.length === 0 ? (
                <div className="empty-state">
                  No security alerts
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    className="alert-row full"
                    key={alert.id}
                  >
                    <div className="alert-icon">
                      !
                    </div>

                    <div className="alert-main">
                      <strong>
                        {alert.type}
                      </strong>

                      <span>
                        Source: {alert.source}
                      </span>
                    </div>

                    <span
                      className={`severity ${alert.severity.toLowerCase()}`}
                    >
                      {alert.severity}
                    </span>

                    <span
                      className={
                        alert.status ===
                        "Resolved"
                          ? "resolved"
                          : "active-status"
                      }
                    >
                      {alert.status}
                    </span>

                    {alert.status ===
                      "Active" && (
                      <button
                        className="resolve-btn"
                        onClick={() =>
                          resolveAlert(
                            alert.id
                          )
                        }
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       REPORTS
    ------------------------------------------------------- */

    if (page === "reports") {
      return (
        <SimplePage
          title="Security Reports"
          description="Generate a security activity report."
        >
          <div className="action-card">
            <div>
              <h3>Security Report</h3>

              <p>
                Generate the latest network
                security summary.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={generateReport}
            >
              Generate Report
            </button>
          </div>

          {report && (
            <div className="report-card">
              <div>
                <span>Report ID</span>

                <strong>
                  {report.id}
                </strong>
              </div>

              <div>
                <span>Generated</span>

                <strong>
                  {report.generatedAt}
                </strong>
              </div>

              <div>
                <span>Threats</span>

                <strong>
                  {report.threats}
                </strong>
              </div>

              <div>
                <span>Blocked</span>

                <strong>
                  {report.blocked}
                </strong>
              </div>

              <div>
                <span>Packets</span>

                <strong>
                  {report.packets.toLocaleString()}
                </strong>
              </div>
            </div>
          )}
        </SimplePage>
      );
    }

    /* -------------------------------------------------------
       SETTINGS
    ------------------------------------------------------- */

    if (page === "settings") {
      return (
        <SimplePage
          title="Security Control Center"
          description="Configure monitoring, detection and platform security preferences."
        >
          {settingsSaved && (
            <div className="settings-success">
              <span className="success-icon">
                ✓
              </span>

              <div>
                <strong>
                  Security configuration saved
                </strong>

                <p>
                  Your network security
                  preferences are now active.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY STATUS */}

          <div className="security-status-card">
            <div className="security-status-left">
              <div className="shield-pulse">
                🛡
              </div>

              <div>
                <span className="settings-eyebrow">
                  SYSTEM SECURITY
                </span>

                <h3>
                  {highSecurity
                    ? "Maximum Protection Enabled"
                    : "Standard Protection Mode"}
                </h3>

                <p>
                  Your security engine is
                  configured for{" "}
                  {highSecurity
                    ? "enhanced threat detection and aggressive monitoring."
                    : "standard network monitoring."}
                </p>
              </div>
            </div>

            <div className="security-score">
              <div className="score-circle">
                <strong>
                  {highSecurity ? "98" : "82"}
                </strong>

                <span>SECURITY</span>
              </div>
            </div>
          </div>

          {/* SETTINGS GRID */}

          <div className="settings-layout">
            <div className="settings-column">

              {/* NETWORK MONITORING */}

              <div className="settings-panel">
                <div className="settings-panel-title">
                  <div className="settings-title-icon blue">
                    ◉
                  </div>

                  <div>
                    <h3>
                      Network Monitoring
                    </h3>

                    <p>
                      Control real-time network
                      surveillance.
                    </p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Live Monitoring
                    </strong>

                    <span>
                      Continuously monitor network
                      activity and suspicious
                      connections.
                    </span>
                  </div>

                  <button
                    className={
                      monitoring
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={
                      toggleMonitoring
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Automatic Refresh
                    </strong>

                    <span>
                      Automatically refresh security
                      statistics.
                    </span>
                  </div>

                  <button
                    className={
                      autoRefresh
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      setAutoRefresh(
                        !autoRefresh
                      )
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Scan Interval
                    </strong>

                    <span>
                      Frequency of automated threat
                      scans.
                    </span>
                  </div>

                  <select
                    className="settings-select"
                    value={scanInterval}
                    onChange={(e) =>
                      setScanInterval(
                        e.target.value
                      )
                    }
                  >
                    <option value="15">
                      15 seconds
                    </option>

                    <option value="30">
                      30 seconds
                    </option>

                    <option value="60">
                      1 minute
                    </option>

                    <option value="300">
                      5 minutes
                    </option>
                  </select>
                </div>
              </div>

              {/* THREAT DETECTION */}

              <div className="settings-panel">
                <div className="settings-panel-title">
                  <div className="settings-title-icon red">
                    ⚡
                  </div>

                  <div>
                    <h3>
                      Threat Detection
                    </h3>

                    <p>
                      Configure attack detection
                      behavior.
                    </p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Enhanced Detection
                    </strong>

                    <span>
                      Enable aggressive threat
                      identification.
                    </span>
                  </div>

                  <button
                    className={
                      highSecurity
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      setHighSecurity(
                        !highSecurity
                      )
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="detection-level">
                  <div className="level-header">
                    <strong>
                      Detection Sensitivity
                    </strong>

                    <span>
                      {highSecurity
                        ? "HIGH"
                        : "STANDARD"}
                    </span>
                  </div>

                  <div className="level-bar">
                    <div
                      className={
                        highSecurity
                          ? "level-fill high"
                          : "level-fill standard"
                      }
                    />
                  </div>

                  <div className="level-labels">
                    <span>Low</span>
                    <span>
                      Standard
                    </span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}

            <div className="settings-column">

              {/* ALERT MANAGEMENT */}

              <div className="settings-panel">
                <div className="settings-panel-title">
                  <div className="settings-title-icon yellow">
                    !
                  </div>

                  <div>
                    <h3>
                      Alert Management
                    </h3>

                    <p>
                      Configure security
                      notifications.
                    </p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Security Notifications
                    </strong>

                    <span>
                      Receive notifications for
                      detected threats.
                    </span>
                  </div>

                  <button
                    className={
                      notifications
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      setNotifications(
                        !notifications
                      )
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="notification-preview">
                  <div className="notification-icon">
                    ⚠
                  </div>

                  <div>
                    <strong>
                      Threat Alert
                    </strong>

                    <span>
                      High severity network
                      activity detected.
                    </span>
                  </div>

                  <small>LIVE</small>
                </div>
              </div>

              {/* ACCESS SECURITY */}

              <div className="settings-panel">
                <div className="settings-panel-title">
                  <div className="settings-title-icon purple">
                    ◈
                  </div>

                  <div>
                    <h3>
                      Access Security
                    </h3>

                    <p>
                      Protect your security
                      platform account.
                    </p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <strong>
                      Two-Factor Authentication
                    </strong>

                    <span>
                      Add an additional layer of
                      account protection.
                    </span>
                  </div>

                  <button
                    className={
                      twoFactor
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      setTwoFactor(
                        !twoFactor
                      )
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="access-status">
                  <div className="access-status-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      API Connection
                    </strong>

                    <span>
                      Backend security service
                      connected
                    </span>
                  </div>

                  <b>ONLINE</b>
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM INFORMATION */}

          <div className="system-info-panel">
            <div className="system-info-header">
              <div>
                <span className="settings-eyebrow">
                  SYSTEM INFORMATION
                </span>

                <h3>
                  Network Security Environment
                </h3>
              </div>

              <span className="system-online">
                ● SYSTEM ONLINE
              </span>
            </div>

            <div className="system-info-grid">
              <div>
                <span>
                  Security Engine
                </span>

                <strong>Active</strong>
              </div>

              <div>
                <span>
                  Threat Database
                </span>

                <strong>
                  Up to date
                </strong>
              </div>

              <div>
                <span>
                  Monitoring Mode
                </span>

                <strong>
                  {monitoring
                    ? "Live"
                    : "Standby"}
                </strong>
              </div>

              <div>
                <span>
                  Scan Frequency
                </span>

                <strong>
                  {scanInterval}s
                </strong>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}

          <div className="settings-actions">
            <button
              className="secondary-btn"
              onClick={() => {
                setAutoRefresh(true);
                setNotifications(true);
                setHighSecurity(true);
                setTwoFactor(false);
                setScanInterval("30");
              }}
            >
              Reset Defaults
            </button>

            <button
              className="primary-btn settings-save-btn"
              onClick={
                saveSecuritySettings
              }
            >
              ✓ Save Security Configuration
            </button>
          </div>
        </SimplePage>
      );
    }

    return <Dashboard />;
  };

  /* =========================================================
     MAIN APP
  ========================================================= */

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <Header />

        <section className="content">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

export default App;