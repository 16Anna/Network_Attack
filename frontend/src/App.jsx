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
const getToken = () => localStorage.getItem("networkAttackToken");

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${getToken()}`,
});


const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#8b5cf6",
];

// =====================================================
// SIMPLE PAGE HEADER
// =====================================================

const SimplePage = ({
  title,
  description,
  children,
  onBack,
}) => {
  return (
    <>
      <div className="welcome-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          className="secondary-btn"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </div>

      {children}
    </>
  );
};

// =====================================================
// APP
// =====================================================

function App() {
  const [page, setPage] = useState("dashboard");

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("networkAttackToken"))
  );

  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [name, setName] = useState("");

  const [dashboard, setDashboard] = useState(null);

  const [monitoring, setMonitoring] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [alerts, setAlerts] = useState([]);

  const [scanResults, setScanResults] = useState([]);

  const [traffic, setTraffic] = useState(null);

  const [target, setTarget] = useState("");

  const [intelResult, setIntelResult] = useState(null);

  const [report, setReport] = useState(null);

  const [monitorStartedAt, setMonitorStartedAt] =
    useState(null);

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = async () => {
    try {
      const token = getToken();

      if (!token) {
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const [dashboardRes, alertsRes] = await Promise.all([
        fetch(`${API}/dashboard`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/alerts`, {
          headers: authHeaders(),
        }),
      ]);

      if (
        dashboardRes.status === 401 ||
        dashboardRes.status === 403 ||
        alertsRes.status === 401 ||
        alertsRes.status === 403
      ) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const dashboardData = await dashboardRes.json();
      const alertData = await alertsRes.json();

      if (dashboardData.success) {
        const d = dashboardData.data || {};

        setDashboard({
          stats: {
            packets: d.packets ?? d.totalPackets ?? 0,
            threats: d.threatsDetected ?? d.threats ?? 0,
            blocked: d.blockedThreats ?? d.blocked ?? 0,
            activeAlerts: d.totalAlerts ?? d.activeAlerts ?? 0,
            connections: d.connections ?? 0,
          },
          risk: {
            score: d.riskScore ?? d.risk?.score ?? 48,
            level: d.riskLevel ?? d.risk?.level ?? "Medium",
          },
          traffic: d.traffic || {},
          protocols: d.protocols || {},
          networkStatus: d.networkStatus || "Secure",
        });
      }

      if (alertData.success) {
        setAlerts(alertData.alerts || alertData.data || []);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      setMessage("Unable to connect to backend");
    }
  };

  // ===================================================
  // INITIAL DASHBOARD LOAD
  // ===================================================

  useEffect(() => {
    if (loggedIn) {
      loadDashboard();
    }
  }, [loggedIn]);

  // ===================================================
  // AUTO REFRESH WHILE MONITORING
  // ===================================================

  useEffect(() => {
    if (!loggedIn || !monitoring) {
      return;
    }

    const interval =
      setInterval(() => {
        loadDashboard();
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [loggedIn, monitoring]);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage(
        "Please enter email and password"
      );
      return;
    }

    try {
      setLoading(true);

      setMessage("");

      const res = await fetch(
        `${API}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message ||
            "Invalid login details"
        );

        return;
      }

      if (data.token) {
        localStorage.setItem(
          "networkAttackToken",
          data.token
        );
      }

      setLoggedIn(true);

      setPage("dashboard");

      setMessage(
        "Login successful"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Backend connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const register = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage(
        "Please fill all fields"
      );

      return;
    }

    try {
      setLoading(true);

      setMessage("");

      const res = await fetch(
        `${API}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message ||
            "Registration failed"
        );

        return;
      }

      setMessage(
        "Account created successfully. Please sign in."
      );

      setAuthMode("login");

      setPassword("");
    } catch (error) {
      console.error(error);

      setMessage(
        "Backend connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // MONITORING
  // ===================================================

  const toggleMonitoring = async () => {
    try {
      setLoading(true);

      const endpoint = monitoring
        ? "/monitor/stop"
        : "/monitor/start";

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: authHeaders(true),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message || "Unable to change monitoring"
        );
        return;
      }

      const isActive =
        data.status === "active" ||
        data.monitoring === true;

      setMonitoring(isActive);
      setMonitorStartedAt(
        isActive ? new Date() : null
      );

      setMessage(
        data.message ||
        (isActive
          ? "Network monitoring started"
          : "Network monitoring stopped")
      );

      await loadDashboard();
    } catch (error) {
      console.error("Monitoring error:", error);
      setMessage("Unable to change monitoring status");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // ATTACK SCAN
  // ===================================================

  const runScan = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/scan`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          target: target.trim(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message || "Network scan failed"
        );
        return;
      }

      const result = data.result || data.attack;

      if (result) {
        const attack = {
          ...result,
          attackType:
            result.attackType ||
            result.type ||
            "Network Threat",
          severity: result.severity || "Medium",
          confidence: result.confidence ?? 0,
        };

        setScanResults(
          (previous) => [attack, ...previous].slice(0, 10)
        );
      }

      setMessage(
        data.message || "Attack scan completed"
      );

      await loadDashboard();
    } catch (error) {
      console.error("Scan error:", error);
      setMessage("Network scan failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // TRAFFIC ANALYSIS
  // ===================================================

  const analyzeTraffic = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/traffic/analyze`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          target: target.trim(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message || "Traffic analysis failed"
        );
        return;
      }

      const a = data.analysis || data.traffic || {};

      setTraffic({
        ...a,
        incoming: a.incoming ?? a.totalPackets ?? 0,
        outgoing: a.outgoing ?? 0,
        suspicious:
          a.suspicious ?? a.suspiciousTraffic ?? 0,
      });

      setMessage(
        data.message || "Traffic analysis completed"
      );

      await loadDashboard();
    } catch (error) {
      console.error("Traffic error:", error);
      setMessage("Traffic analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // THREAT INTELLIGENCE
  // ===================================================

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
        headers: authHeaders(true),
        body: JSON.stringify({
          target: value,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message || "Threat intelligence failed"
        );
        return;
      }

      const result = data.result || {};

      const riskMap = {
        Critical: 95,
        High: 80,
        Medium: 55,
        Low: 20,
      };

      setIntelResult({
        ...result,
        riskScore:
          result.riskScore ??
          riskMap[result.riskLevel] ??
          0,
        reputation:
          result.reputation ||
          result.riskLevel ||
          "Unknown",
        category:
          result.category ||
          result.threatType ||
          "Unknown",
        reports:
          result.reports ??
          result.confidence ??
          "N/A",
      });

      setMessage(
        "Threat intelligence analysis completed"
      );
    } catch (error) {
      console.error("Threat intelligence error:", error);
      setMessage(
        "Threat intelligence analysis failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RESOLVE ALERT
  // ===================================================

  const resolveAlert = async (id) => {
    if (!id) return;

    try {
      const res = await fetch(
        `${API}/alerts/${id}/resolve`,
        {
          method: "PATCH",
          headers: authHeaders(true),
        }
      );

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message || "Unable to resolve alert"
        );
        return;
      }

      setMessage("Alert resolved successfully");
      await loadDashboard();
    } catch (error) {
      console.error("Resolve alert error:", error);
      setMessage("Unable to resolve alert");
    }
  };

  // ===================================================
  // GENERATE REPORT
  // ===================================================

  const generateReport = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/reports`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          type: "Network Security Report",
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("networkAttackToken");
        setLoggedIn(false);
        setPage("login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message || "Report generation failed");
        return;
      }

      const rawReport = data.report || data.data || {};

      const riskScoreMap = {
        Critical: 90,
        High: 75,
        Medium: 50,
        Low: 20,
      };

      const threatsDetected = Number(
        rawReport.threatsDetected ?? rawReport.threats ?? 0
      );

      const activeAlerts = Number(
        rawReport.activeAlerts ?? rawReport.alerts ?? 0
      );

      const resolvedAlerts = Number(
        rawReport.resolvedAlerts ?? 0
      );

      const blockedThreats = Number(
        rawReport.blockedThreats ??
          Math.max(0, threatsDetected - activeAlerts)
      );

      const riskScore = Number(
        rawReport.riskScore ??
          riskScoreMap[rawReport.riskLevel] ??
          0
      );

      const normalizedReport = {
        ...rawReport,
        threats: threatsDetected,
        blocked: blockedThreats,
        alerts: activeAlerts,
        riskScore,
        threatsDetected,
        activeAlerts,
        resolvedAlerts,
        highRiskThreats: Number(rawReport.highRiskThreats ?? 0),
        riskLevel: rawReport.riskLevel || "Low",
      };

      setReport(normalizedReport);
      setMessage("Security report generated successfully");
    } catch (error) {
      console.error("Report error:", error);
      setMessage("Report generation failed");
    } finally {
      setLoading(false);
    }
  };;

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    localStorage.removeItem(
      "networkAttackToken"
    );

    setLoggedIn(false);

    setPage("dashboard");

    setMonitoring(false);

    setMessage("");
  };

  // ===================================================
  // AUTH PAGE
  // ===================================================

  if (!loggedIn) {
    return (
      <div className="auth-page">

        <div className="auth-left">

          <div className="brand-large">

            <div className="brand-icon">
              🛡
            </div>

            <div>
              <h1>
                Network Attack
              </h1>

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
              Monitor suspicious activity,
              analyze traffic, investigate
              threats and generate security
              reports from one centralized
              security platform.
            </p>

            <div className="hero-features">

              <span>
                ✓ Real-time Monitoring
              </span>

              <span>
                ✓ Threat Detection
              </span>

              <span>
                ✓ Traffic Analysis
              </span>

              <span>
                ✓ Security Intelligence
              </span>

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

                <label>
                  Full Name
                </label>

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

              <label>
                Email Address
              </label>

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

              <label>
                Password
              </label>

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
                  onClick={() => {
                    setAuthMode(
                      "register"
                    );

                    setMessage("");
                  }}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?

                <button
                  onClick={() => {
                    setAuthMode(
                      "login"
                    );

                    setMessage("");
                  }}
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

  // ===================================================
  // DATA
  // ===================================================

  const stats =
    dashboard?.stats || {
      packets: 0,
      threats: 0,
      blocked: 0,
      activeAlerts: 0,
      connections: 0,
    };

  const riskScore =
    dashboard?.risk?.score ?? 48;

  const riskLevel =
    dashboard?.risk?.level ||
    "Medium";

  const activeAlerts =
    alerts.filter(
      (alert) =>
        alert.status === "Active"
    );

  const resolvedAlerts =
    alerts.filter(
      (alert) =>
        alert.status === "Resolved"
    );

  const severityData = [
    {
      name: "Critical",
      value: Math.max(
        1,
        Math.round(
          stats.threats * 0.18
        )
      ),
    },

    {
      name: "High",
      value: Math.max(
        1,
        Math.round(
          stats.threats * 0.32
        )
      ),
    },

    {
      name: "Medium",
      value: Math.max(
        1,
        Math.round(
          stats.threats * 0.35
        )
      ),
    },

    {
      name: "Low",
      value: Math.max(
        1,
        Math.round(
          stats.threats * 0.15
        )
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

  const trafficSource =
    dashboard?.traffic || {};

  const trafficData = [
    {
      name: "Incoming",
      value:
        traffic?.incoming ??
        trafficSource.incoming ??
        48,
    },

    {
      name: "Outgoing",
      value:
        traffic?.outgoing ??
        trafficSource.outgoing ??
        32,
    },

    {
      name: "Suspicious",
      value:
        traffic?.suspicious ??
        trafficSource.suspicious ??
        20,
    },
  ];

  const protocolSource =
    dashboard?.protocols || {};

  const protocolData = [
    {
      name: "TCP",
      value:
        Number(
          protocolSource.TCP ?? 55
        ),
    },

    {
      name: "UDP",
      value:
        Number(
          protocolSource.UDP ?? 30
        ),
    },

    {
      name: "ICMP",
      value:
        Number(
          protocolSource.ICMP ?? 15
        ),
    },
  ];

  const alertStatusData = [
    {
      name: "Active",
      value:
        activeAlerts.length,
    },

    {
      name: "Resolved",
      value:
        resolvedAlerts.length,
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

  // ===================================================
  // SIDEBAR
  // ===================================================

  const Sidebar = () => (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="brand-icon small">
          🛡
        </div>

        <div>
          <strong>
            Network Attack
          </strong>

          <span>
            Security Platform
          </span>
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

          {activeAlerts.length > 0 && (
            <b className="nav-badge">
              {activeAlerts.length}
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
          onClick={logout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );

  // ===================================================
  // HEADER
  // ===================================================

  const pageTitle = {
    dashboard:
      "Security Dashboard",

    monitor:
      "Network Monitor",

    attacks:
      "Attack Detection",

    traffic:
      "Traffic Analysis",

    intel:
      "Threat Intelligence",

    alerts:
      "Security Alerts",

    reports:
      "Security Reports",

    settings:
      "Settings",
  };

  const Header = () => (
    <header className="topbar">

      <div>

        <h1>
          {pageTitle[page]}
        </h1>

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
            {email
              ? email
                  .charAt(0)
                  .toUpperCase()
              : "A"}
          </div>

          <div>

            <strong>
              {email
                ? email.split("@")[0]
                : "Admin"}
            </strong>

            <span>
              Security Analyst
            </span>

          </div>

        </div>

      </div>

    </header>
  );

  // ===================================================
  // DASHBOARD
  // ===================================================

  const Dashboard = () => (
    <>

      <div className="welcome-row">

        <div>

          <h2>
            Security Overview
          </h2>

          <p>
            Monitor your network health
            and security activity in real
            time.
          </p>

        </div>

        <button
          className={
            monitoring
              ? "danger-btn"
              : "primary-btn compact"
          }
          onClick={
            toggleMonitoring
          }
          disabled={loading}
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

            <span>
              Total Packets
            </span>

            <strong>
              {Number(
                stats.packets
              ).toLocaleString()}
            </strong>

            <small>
              Network traffic
            </small>

          </div>

        </div>

        <div className="stat-card red">

          <div className="stat-icon">
            ⚠
          </div>

          <div>

            <span>
              Threats Detected
            </span>

            <strong>
              {stats.threats}
            </strong>

            <small>
              Security events
            </small>

          </div>

        </div>

        <div className="stat-card green">

          <div className="stat-icon">
            ✓
          </div>

          <div>

            <span>
              Threats Blocked
            </span>

            <strong>
              {stats.blocked}
            </strong>

            <small>
              Successfully blocked
            </small>

          </div>

        </div>

        <div className="stat-card blue">

          <div className="stat-icon">
            ◉
          </div>

          <div>

            <span>
              Active Connections
            </span>

            <strong>
              {Number(
                stats.connections
              ).toLocaleString()}
            </strong>

            <small>
              Current connections
            </small>

          </div>

        </div>

      </div>

      <div className="chart-grid">

        <div className="panel chart-panel">

          <div className="panel-header">

            <div>

              <h3>
                Threat Severity
              </h3>

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
                        fill={
                          COLORS[index]
                        }
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

              <span>
                Threats
              </span>

            </div>

          </div>

        </div>

        <div className="panel chart-panel">

          <div className="panel-header">

            <div>

              <h3>
                Attack Types
              </h3>

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
                      fill={
                        COLORS[index]
                      }
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

      <div className="chart-grid">

        <div className="panel chart-panel">

          <div className="panel-header">

            <div>

              <h3>
                Alert Status
              </h3>

              <p>
                Active and resolved
                security alerts
              </p>

            </div>

            <span className="live-badge">
              STATUS
            </span>

          </div>

          <div className="pie-container">

            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>

                <Pie
                  data={
                    alertStatusData
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {alertStatusData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          index === 0
                            ? "#ef4444"
                            : "#22c55e"
                        }
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
                {alerts.length}
              </strong>

              <span>
                Alerts
              </span>

            </div>

          </div>

        </div>

        <div className="panel chart-panel">

          <div className="panel-header">

            <div>

              <h3>
                Network Protocols
              </h3>

              <p>
                Protocol distribution
              </p>

            </div>

            <span className="live-badge">
              NETWORK
            </span>

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
                        fill={
                          COLORS[index]
                        }
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
                3
              </strong>

              <span>
                Protocols
              </span>

            </div>

          </div>

        </div>

      </div>

      <div className="chart-grid">

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Security Activity
              </h3>

              <p>
                Threat activity throughout
                the day
              </p>

            </div>

          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <LineChart
              data={activityData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="threats"
                name="Threats"
                stroke="#ef4444"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="packets"
                name="Traffic"
                stroke="#6366f1"
                strokeWidth={3}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="panel">

          <div className="panel-header">

            <div>

              <h3>
                Traffic Distribution
              </h3>

              <p>
                Incoming and outgoing
                traffic
              </p>

            </div>

          </div>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={trafficData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                name="Traffic"
                fill="#6366f1"
                radius={[
                  8,
                  8,
                  0,
                  0,
                ]}
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
                    key={
                      alert._id ||
                      alert.id
                    }
                  >

                    <div className="alert-icon">
                      !
                    </div>

                    <div className="alert-main">

                      <strong>
                        {alert.type ||
                          alert.title}
                      </strong>

                      <span>
                        Source:{" "}
                        {alert.source}
                      </span>

                    </div>

                    <span
                      className={`severity ${
                        alert.severity?.toLowerCase() ||
                        "medium"
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="alert-time">
                      {alert.createdAt
                        ? new Date(
                            alert.createdAt
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )
                        : "Now"}
                    </span>

                  </div>
                ))
            )}

          </div>

        </div>

        <div className="panel quick-panel">

          <div className="panel-header">

            <div>

              <h3>
                Quick Actions
              </h3>

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
                Detect suspicious
                activity
              </small>

            </div>

            <span>
              →
            </span>

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

            <span>
              →
            </span>

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

            <span>
              →
            </span>

          </button>

        </div>

      </div>

    </>
  );

  // ===================================================
  // RENDER PAGES
  // ===================================================

  const renderPage = () => {

    // =================================================
    // DASHBOARD
    // =================================================

    if (page === "dashboard") {
      return <Dashboard />;
    }

    // =================================================
    // NETWORK MONITOR
    // =================================================

    if (page === "monitor") {

      const incoming =
        Number(
          trafficData[0]?.value || 0
        );

      const outgoing =
        Number(
          trafficData[1]?.value || 0
        );

      const suspicious =
        Number(
          trafficData[2]?.value || 0
        );

      const maximum =
        Math.max(
          incoming,
          outgoing,
          suspicious,
          1
        );

      const healthGood =
        riskScore < 55;

      return (
        <SimplePage
          title="Network Monitor"
          description="Control and observe real-time network monitoring."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          {/* =========================================
              MONITOR CONTROL PANEL
          ========================================= */}

          <div
            className="panel"
            style={{
              padding: "28px",
              marginBottom: "18px",
              background:
                "linear-gradient(135deg, rgba(9,28,46,0.98), rgba(5,17,30,0.98))",
              border:
                "1px solid rgba(65,183,255,0.12)",
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) 280px",
                gap: "30px",
                alignItems: "center",
              }}
            >

              {/* LEFT */}

              <div>

                <div
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "8px",
                    padding:
                      "7px 12px",
                    borderRadius:
                      "999px",
                    border: monitoring
                      ? "1px solid rgba(34,197,94,0.25)"
                      : "1px solid rgba(100,116,139,0.2)",
                    background:
                      monitoring
                        ? "rgba(34,197,94,0.08)"
                        : "rgba(100,116,139,0.08)",
                    color:
                      monitoring
                        ? "#4ade80"
                        : "#94a3b8",
                    fontSize:
                      "10px",
                    fontWeight: 700,
                    letterSpacing:
                      "1px",
                    textTransform:
                      "uppercase",
                    marginBottom:
                      "16px",
                  }}
                >

                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius:
                        "50%",
                      background:
                        monitoring
                          ? "#4ade80"
                          : "#64748b",
                      boxShadow:
                        monitoring
                          ? "0 0 12px rgba(74,222,128,0.8)"
                          : "none",
                    }}
                  />

                  {monitoring
                    ? "Sensor Online"
                    : "Sensor Offline"}

                </div>

                <h3
                  style={{
                    fontSize:
                      "28px",
                    margin:
                      "0 0 10px",
                    color:
                      "#e8f2ff",
                  }}
                >
                  {monitoring
                    ? "Network monitoring is active"
                    : "Network monitoring is offline"}
                </h3>

                <p
                  style={{
                    margin:
                      "0 0 22px",
                    maxWidth:
                      "650px",
                    color:
                      "var(--muted)",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.7,
                  }}
                >
                  {monitoring
                    ? "The security sensor is currently observing network activity. Dashboard statistics are refreshed automatically."
                    : "The monitoring sensor is currently in standby. Start monitoring to begin observing network activity."}
                </p>

                <button
                  className={
                    monitoring
                      ? "danger-btn"
                      : "primary-btn"
                  }
                  onClick={
                    toggleMonitoring
                  }
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : monitoring
                    ? "■ Stop Monitoring"
                    : "▶ Start Monitoring"}
                </button>

              </div>

              {/* RIGHT STATUS */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                }}
              >

                <div
                  style={{
                    width:
                      "170px",
                    height:
                      "170px",
                    borderRadius:
                      "50%",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    border:
                      monitoring
                        ? "1px solid rgba(34,197,94,0.30)"
                        : "1px solid rgba(100,116,139,0.20)",
                    background:
                      monitoring
                        ? "radial-gradient(circle, rgba(34,197,94,0.16), rgba(34,197,94,0.03) 55%, transparent 65%)"
                        : "radial-gradient(circle, rgba(100,116,139,0.12), rgba(100,116,139,0.03) 55%, transparent 65%)",
                    boxShadow:
                      monitoring
                        ? "0 0 50px rgba(34,197,94,0.12)"
                        : "none",
                  }}
                >

                  <div
                    style={{
                      textAlign:
                        "center",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "32px",
                        fontWeight:
                          800,
                        color:
                          monitoring
                            ? "#4ade80"
                            : "#64748b",
                      }}
                    >
                      {monitoring
                        ? "ON"
                        : "OFF"}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "9px",
                        letterSpacing:
                          "1.2px",
                        textTransform:
                          "uppercase",
                        color:
                          "var(--muted)",
                        marginTop:
                          "5px",
                      }}
                    >
                      Network Sensor
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* =========================================
              MONITOR STAT CARDS
          ========================================= */}

          <div
            className="stat-grid"
            style={{
              marginBottom:
                "18px",
            }}
          >

            <div className="stat-card purple">

              <div className="stat-icon">
                ⌁
              </div>

              <div>

                <span>
                  Packets Observed
                </span>

                <strong>
                  {Number(
                    stats.packets
                  ).toLocaleString()}
                </strong>

                <small>
                  Total network packets
                </small>

              </div>

            </div>

            <div className="stat-card blue">

              <div className="stat-icon">
                ◉
              </div>

              <div>

                <span>
                  Active Connections
                </span>

                <strong>
                  {Number(
                    stats.connections
                  ).toLocaleString()}
                </strong>

                <small>
                  Current connections
                </small>

              </div>

            </div>

            <div className="stat-card red">

              <div className="stat-icon">
                ⚠
              </div>

              <div>

                <span>
                  Threats Detected
                </span>

                <strong>
                  {stats.threats}
                </strong>

                <small>
                  Security events
                </small>

              </div>

            </div>

            <div className="stat-card green">

              <div className="stat-icon">
                ✓
              </div>

              <div>

                <span>
                  Threats Blocked
                </span>

                <strong>
                  {stats.blocked}
                </strong>

                <small>
                  Successfully contained
                </small>

              </div>

            </div>

          </div>

          {/* =========================================
              MONITORING HEALTH + TRAFFIC
          ========================================= */}

          <div className="chart-grid">

            {/* NETWORK ACTIVITY */}

            <div
              className="panel"
              style={{
                padding:
                  "24px",
              }}
            >

              <div className="panel-header">

                <div>

                  <h3>
                    Network Activity
                  </h3>

                  <p>
                    Current traffic distribution
                  </p>

                </div>

                <span className="live-badge">
                  {monitoring
                    ? "LIVE"
                    : "STANDBY"}
                </span>

              </div>

              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                {[
                  {
                    label:
                      "Incoming Traffic",
                    value:
                      incoming,
                    accent:
                      "#06b6d4",
                  },

                  {
                    label:
                      "Outgoing Traffic",
                    value:
                      outgoing,
                    accent:
                      "#6366f1",
                  },

                  {
                    label:
                      "Suspicious Traffic",
                    value:
                      suspicious,
                    accent:
                      "#ef4444",
                  },
                ].map(
                  (item) => (
                    <div
                      key={
                        item.label
                      }
                      style={{
                        marginBottom:
                          "22px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "8px",
                        }}
                      >

                        <span
                          style={{
                            color:
                              "var(--muted)",
                            fontSize:
                              "11px",
                          }}
                        >
                          {item.label}
                        </span>

                        <strong
                          style={{
                            fontSize:
                              "12px",
                          }}
                        >
                          {Number(
                            item.value
                          ).toLocaleString()}
                        </strong>

                      </div>

                      <div
                        style={{
                          height:
                            "8px",
                          borderRadius:
                            "999px",
                          background:
                            "rgba(255,255,255,0.06)",
                          overflow:
                            "hidden",
                        }}
                      >

                        <div
                          style={{
                            width: `${Math.max(
                              4,
                              Math.round(
                                (item.value /
                                  maximum) *
                                  100
                              )
                            )}%`,
                            height:
                              "100%",
                            borderRadius:
                              "999px",
                            background:
                              item.accent,
                            boxShadow:
                              `0 0 12px ${item.accent}`,
                            transition:
                              "width 0.5s ease",
                          }}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

            {/* SECURITY HEALTH */}

            <div
              className="panel"
              style={{
                padding:
                  "24px",
              }}
            >

              <div className="panel-header">

                <div>

                  <h3>
                    Security Health
                  </h3>

                  <p>
                    Current system condition
                  </p>

                </div>

                <span className="live-badge">
                  STATUS
                </span>

              </div>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "12px",
                  marginTop:
                    "18px",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(89,190,255,0.07)",
                  }}
                >

                  <span
                    style={{
                      color:
                        "var(--muted)",
                      fontSize:
                        "11px",
                    }}
                  >
                    Monitoring Sensor
                  </span>

                  <strong
                    style={{
                      color:
                        monitoring
                          ? "#4ade80"
                          : "#f59e0b",
                      fontSize:
                        "12px",
                    }}
                  >
                    {monitoring
                      ? "Online"
                      : "Offline"}
                  </strong>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(89,190,255,0.07)",
                  }}
                >

                  <span
                    style={{
                      color:
                        "var(--muted)",
                      fontSize:
                        "11px",
                    }}
                  >
                    API Connection
                  </span>

                  <strong
                    style={{
                      color:
                        "#4ade80",
                      fontSize:
                        "12px",
                    }}
                  >
                    Connected
                  </strong>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(89,190,255,0.07)",
                  }}
                >

                  <span
                    style={{
                      color:
                        "var(--muted)",
                      fontSize:
                        "11px",
                    }}
                  >
                    Current Risk
                  </span>

                  <strong
                    style={{
                      color:
                        healthGood
                          ? "#4ade80"
                          : "#f59e0b",
                      fontSize:
                        "12px",
                    }}
                  >
                    {riskLevel}{" "}
                    ({riskScore})
                  </strong>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "14px",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(89,190,255,0.07)",
                  }}
                >

                  <span
                    style={{
                      color:
                        "var(--muted)",
                      fontSize:
                        "11px",
                    }}
                  >
                    Active Alerts
                  </span>

                  <strong
                    style={{
                      color:
                        activeAlerts.length ===
                        0
                          ? "#4ade80"
                          : "#ef4444",
                      fontSize:
                        "12px",
                    }}
                  >
                    {activeAlerts.length}
                  </strong>

                </div>

              </div>

            </div>

          </div>

          {/* =========================================
              SENSOR SUMMARY
          ========================================= */}

          <div
            className="panel"
            style={{
              marginTop:
                "18px",
              padding:
                "24px",
            }}
          >

            <div className="panel-header">

              <div>

                <h3>
                  Sensor Summary
                </h3>

                <p>
                  Overview of the current
                  network monitoring state
                </p>

              </div>

              <span className="live-badge">
                SENSOR
              </span>

            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap:
                  "14px",
                marginTop:
                  "18px",
              }}
            >

              <div
                style={{
                  padding:
                    "18px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(99,102,241,0.05)",
                  border:
                    "1px solid rgba(99,102,241,0.12)",
                }}
              >

                <span
                  style={{
                    display:
                      "block",
                    color:
                      "var(--muted)",
                    fontSize:
                      "10px",
                    marginBottom:
                      "8px",
                  }}
                >
                  Risk Score
                </span>

                <strong
                  style={{
                    fontSize:
                      "22px",
                  }}
                >
                  {riskScore}
                  <small
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "var(--muted)",
                      marginLeft:
                        "4px",
                    }}
                  >
                    /100
                  </small>
                </strong>

              </div>

              <div
                style={{
                  padding:
                    "18px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(6,182,212,0.05)",
                  border:
                    "1px solid rgba(6,182,212,0.12)",
                }}
              >

                <span
                  style={{
                    display:
                      "block",
                    color:
                      "var(--muted)",
                    fontSize:
                      "10px",
                    marginBottom:
                      "8px",
                  }}
                >
                  Protocols
                </span>

                <strong
                  style={{
                    fontSize:
                      "22px",
                  }}
                >
                  3
                </strong>

              </div>

              <div
                style={{
                  padding:
                    "18px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(239,68,68,0.05)",
                  border:
                    "1px solid rgba(239,68,68,0.12)",
                }}
              >

                <span
                  style={{
                    display:
                      "block",
                    color:
                      "var(--muted)",
                    fontSize:
                      "10px",
                    marginBottom:
                      "8px",
                  }}
                >
                  Active Alerts
                </span>

                <strong
                  style={{
                    fontSize:
                      "22px",
                  }}
                >
                  {activeAlerts.length}
                </strong>

              </div>

              <div
                style={{
                  padding:
                    "18px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(34,197,94,0.05)",
                  border:
                    "1px solid rgba(34,197,94,0.12)",
                }}
              >

                <span
                  style={{
                    display:
                      "block",
                    color:
                      "var(--muted)",
                    fontSize:
                      "10px",
                    marginBottom:
                      "8px",
                  }}
                >
                  Monitoring
                </span>

                <strong
                  style={{
                    fontSize:
                      "22px",
                  }}
                >
                  {monitoring
                    ? "ON"
                    : "OFF"}
                </strong>

              </div>

            </div>

          </div>

        </SimplePage>
      );
    }

    // =================================================
    // ATTACK DETECTION
    // =================================================

    if (page === "attacks") {
      return (
        <SimplePage
          title="Attack Detection"
          description="Scan the network for potential attacks."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          <div className="action-card">

            <div>

              <h3>
                Network Attack Scanner
              </h3>

              <p>
                Run a security scan to
                detect suspicious network
                activity.
              </p>

            </div>

            <button
              className="primary-btn"
              onClick={runScan}
              disabled={loading}
            >
              {loading
                ? "Scanning..."
                : "Run Attack Scan"}
            </button>

          </div>

          {scanResults.length > 0 && (
            <div className="panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Latest Detected Threats
                  </h3>

                  <p>
                    Results from the latest
                    network scans
                  </p>

                </div>

                <span className="live-badge">
                  DETECTION
                </span>

              </div>

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>
                        Attack
                      </th>

                      <th>
                        Source
                      </th>

                      <th>
                        Destination
                      </th>

                      <th>
                        Severity
                      </th>

                      <th>
                        Confidence
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {scanResults.map(
                      (item, index) => (
                        <tr
                          key={
                            item._id ||
                            index
                          }
                        >

                          <td>
                            {item.attackType ||
                              item.type}
                          </td>

                          <td>
                            {item.sourceIP ||
                              item.source}
                          </td>

                          <td>
                            {item.targetIP ||
                              item.destination}
                          </td>

                          <td>

                            <span
                              className={`severity ${
                                item.severity?.toLowerCase() ||
                                "medium"
                              }`}
                            >
                              {item.severity}
                            </span>

                          </td>

                          <td>
                            {item.confidence}%
                          </td>

                          <td>
                            {item.status ||
                              "Detected"}
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

    // =================================================
    // TRAFFIC ANALYSIS
    // =================================================

    if (page === "traffic") {
      return (
        <SimplePage
          title="Traffic Analysis"
          description="Analyze network packet distribution and protocols."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          <div className="action-card">

            <div>

              <h3>
                Traffic Analyzer
              </h3>

              <p>
                Inspect incoming,
                outgoing and suspicious
                network traffic.
              </p>

            </div>

            <button
              className="primary-btn"
              onClick={analyzeTraffic}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Traffic"}
            </button>

          </div>

          <div className="chart-grid">

            <div className="panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Protocol Distribution
                  </h3>

                  <p>
                    TCP, UDP and ICMP
                    traffic
                  </p>

                </div>

              </div>

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <PieChart>

                  <Pie
                    data={
                      protocolData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={5}
                  >

                    {protocolData.map(
                      (item, index) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            COLORS[index]
                          }
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

                <div>

                  <h3>
                    Traffic Volume
                  </h3>

                  <p>
                    Current traffic
                    distribution
                  </p>

                </div>

              </div>

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <BarChart
                  data={
                    trafficData
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#06b6d4"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          {traffic && (
            <div
              className="stat-grid"
              style={{
                marginTop:
                  "18px",
              }}
            >

              <div className="stat-card blue">

                <div className="stat-icon">
                  ↓
                </div>

                <div>

                  <span>
                    Incoming
                  </span>

                  <strong>
                    {traffic.incoming}
                  </strong>

                  <small>
                    Traffic units
                  </small>

                </div>

              </div>

              <div className="stat-card purple">

                <div className="stat-icon">
                  ↑
                </div>

                <div>

                  <span>
                    Outgoing
                  </span>

                  <strong>
                    {traffic.outgoing}
                  </strong>

                  <small>
                    Traffic units
                  </small>

                </div>

              </div>

              <div className="stat-card red">

                <div className="stat-icon">
                  ⚠
                </div>

                <div>

                  <span>
                    Suspicious
                  </span>

                  <strong>
                    {traffic.suspicious}
                  </strong>

                  <small>
                    Requires monitoring
                  </small>

                </div>

              </div>

            </div>
          )}

        </SimplePage>
      );
    }

    // =================================================
    // THREAT INTELLIGENCE
    // =================================================

    if (page === "intel") {
      return (
        <SimplePage
          title="Threat Intelligence"
          description="Investigate an IP address or domain."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          <div
            className="panel"
            style={{
              padding:
                "26px",
            }}
          >

            <div className="panel-header">

              <div>

                <h3>
                  Threat Investigation
                </h3>

                <p>
                  Enter an IP address or
                  domain for security
                  analysis.
                </p>

              </div>

            </div>

            <div
              className="intel-box"
              style={{
                marginTop:
                  "20px",
              }}
            >

              <input
                value={target}
                onChange={(e) =>
                  setTarget(
                    e.target.value
                  )
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

          </div>

          {intelResult && (
            <div
              className="intel-result"
              style={{
                marginTop:
                  "18px",
              }}
            >

              <div className="risk-score">

                <strong>
                  {intelResult.riskScore}
                </strong>

                <span>
                  Risk Score
                </span>

              </div>

              <div>

                <span>
                  Reputation
                </span>

                <strong>
                  {
                    intelResult.reputation
                  }
                </strong>

              </div>

              <div>

                <span>
                  Category
                </span>

                <strong>
                  {
                    intelResult.category
                  }
                </strong>

              </div>

              <div>

                <span>
                  Reports
                </span>

                <strong>
                  {
                    intelResult.reports
                  }
                </strong>

              </div>

            </div>
          )}

        </SimplePage>
      );
    }

    // =================================================
    // ALERTS
    // =================================================

    if (page === "alerts") {
      return (
        <SimplePage
          title="Security Alerts"
          description="Review and resolve detected security alerts."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          <div className="panel">

            <div className="panel-header">

              <div>

                <h3>
                  Security Alert Center
                </h3>

                <p>
                  Review active and
                  resolved security events.
                </p>

              </div>

              <span className="live-badge">
                {activeAlerts.length} ACTIVE
              </span>

            </div>

            <div className="alert-list">

              {alerts.length === 0 ? (
                <div className="empty-state">
                  No security alerts found.
                </div>
              ) : (
                alerts.map(
                  (alert) => (
                    <div
                      className="alert-row full"
                      key={
                        alert._id ||
                        alert.id
                      }
                    >

                      <div className="alert-icon">
                        !
                      </div>

                      <div className="alert-main">

                        <strong>
                          {alert.type ||
                            alert.title}
                        </strong>

                        <span>
                          Source:{" "}
                          {alert.source}
                        </span>

                        {alert.description && (
                          <small
                            style={{
                              marginTop:
                                "4px",
                            }}
                          >
                            {
                              alert.description
                            }
                          </small>
                        )}

                      </div>

                      <span
                        className={`severity ${
                          alert.severity?.toLowerCase() ||
                          "medium"
                        }`}
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
                              alert._id ||
                                alert.id
                            )
                          }
                        >
                          Resolve
                        </button>
                      )}

                    </div>
                  )
                )
              )}

            </div>

          </div>

        </SimplePage>
      );
    }

    // =================================================
    // REPORTS
    // =================================================

    if (page === "reports") {
      return (
        <SimplePage
          title="Security Reports"
          description="Generate and review network security reports."
          onBack={() =>
            setPage("dashboard")
          }
        >

          {message && (
            <div className="toast-message">
              {message}
            </div>
          )}

          <div className="action-card">

            <div>

              <h3>
                Network Security Report
              </h3>

              <p>
                Generate a current
                security summary from
                the backend.
              </p>

            </div>

            <button
              className="primary-btn"
              onClick={generateReport}
              disabled={loading}
            >
              {loading
                ? "Generating..."
                : "Generate Report"}
            </button>

          </div>

          {report && (
            <div
              className="report-card"
              style={{
                marginTop:
                  "18px",
              }}
            >

              <div>

                <span>
                  Report ID
                </span>

                <strong>
                  {report._id ||
                    report.id ||
                    "Generated"}
                </strong>

              </div>

              <div>

                <span>
                  Generated
                </span>

                <strong>
                  {report.createdAt
                    ? new Date(
                        report.createdAt
                      ).toLocaleString()
                    : "Just now"}
                </strong>

              </div>

              <div>

                <span>
                  Threats
                </span>

                <strong>
                  {report.threats ??
                    0}
                </strong>

              </div>

              <div>

                <span>
                  Blocked
                </span>

                <strong>
                  {report.blocked ??
                    0}
                </strong>

              </div>

              <div>

                <span>
                  Active Alerts
                </span>

                <strong>
                  {report.alerts ??
                    0}
                </strong>

              </div>

              <div>

                <span>
                  Risk Score
                </span>

                <strong>
                  {report.riskScore ??
                    0}
                </strong>

              </div>

            </div>
          )}

        </SimplePage>
      );
    }

    // =================================================
    // SETTINGS
    // =================================================

    return (
      <SimplePage
        title="Settings"
        description="Manage security platform preferences."
        onBack={() =>
          setPage("dashboard")
        }
      >

        {message && (
          <div className="toast-message">
            {message}
          </div>
        )}

        <div className="settings-grid">

          <div className="setting-card">

            <span>
              Monitoring Status
            </span>

            <strong>
              {monitoring
                ? "Active"
                : "Inactive"}
            </strong>

          </div>

          <div className="setting-card">

            <span>
              API Status
            </span>

            <strong>
              Connected
            </strong>

          </div>

          <div className="setting-card">

            <span>
              Database
            </span>

            <strong>
              MongoDB
            </strong>

          </div>

          <div className="setting-card">

            <span>
              Security Mode
            </span>

            <strong>
              Protected
            </strong>

          </div>

        </div>

        <div
          className="panel"
          style={{
            marginTop:
              "18px",
            padding:
              "24px",
          }}
        >

          <div className="panel-header">

            <div>

              <h3>
                System Information
              </h3>

              <p>
                Current Network Attack
                platform configuration.
              </p>

            </div>

          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap:
                "12px",
              marginTop:
                "18px",
            }}
          >

            <div
              style={{
                padding:
                  "16px",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,255,255,0.025)",
                border:
                  "1px solid rgba(89,190,255,0.07)",
              }}
            >

              <span
                style={{
                  color:
                    "var(--muted)",
                  fontSize:
                    "10px",
                }}
              >
                Backend
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                }}
              >
                Express.js
              </strong>

            </div>

            <div
              style={{
                padding:
                  "16px",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,255,255,0.025)",
                border:
                  "1px solid rgba(89,190,255,0.07)",
              }}
            >

              <span
                style={{
                  color:
                    "var(--muted)",
                  fontSize:
                    "10px",
                }}
              >
                Database
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                }}
              >
                MongoDB
              </strong>

            </div>

            <div
              style={{
                padding:
                  "16px",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,255,255,0.025)",
                border:
                  "1px solid rgba(89,190,255,0.07)",
              }}
            >

              <span
                style={{
                  color:
                    "var(--muted)",
                  fontSize:
                    "10px",
                }}
              >
                Security API
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                }}
              >
                Online
              </strong>

            </div>

            <div
              style={{
                padding:
                  "16px",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,255,255,0.025)",
                border:
                  "1px solid rgba(89,190,255,0.07)",
              }}
            >

              <span
                style={{
                  color:
                    "var(--muted)",
                  fontSize:
                    "10px",
                }}
              >
                Monitoring Refresh
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                }}
              >
                5 seconds
              </strong>

            </div>

          </div>

        </div>

      </SimplePage>
    );
  };

  // ===================================================
  // FINAL APP LAYOUT
  // ===================================================

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