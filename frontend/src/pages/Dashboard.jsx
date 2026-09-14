import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Bell,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Wifi,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const trafficData = [
  { time: "10:00", traffic: 42 },
  { time: "10:10", traffic: 58 },
  { time: "10:20", traffic: 51 },
  { time: "10:30", traffic: 74 },
  { time: "10:40", traffic: 62 },
  { time: "10:50", traffic: 88 },
  { time: "11:00", traffic: 70 },
  { time: "11:10", traffic: 94 },
];

const attacks = [
  {
    type: "Port Scanning",
    source: "192.168.1.45",
    severity: "Medium",
    time: "2 min ago",
  },
  {
    type: "Brute Force",
    source: "10.0.0.21",
    severity: "High",
    time: "8 min ago",
  },
  {
    type: "SQL Injection",
    source: "172.16.0.8",
    severity: "Critical",
    time: "14 min ago",
  },
  {
    type: "Suspicious Traffic",
    source: "192.168.0.14",
    severity: "Low",
    time: "21 min ago",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Network Monitor",
      icon: <Activity size={18} />,
    },
    {
      name: "Attack Detection",
      icon: <ShieldAlert size={18} />,
    },
    {
      name: "Threat Alerts",
      icon: <Bell size={18} />,
    },
    {
      name: "Analytics",
      icon: <BarChart3 size={18} />,
    },
    {
      name: "Reports",
      icon: <FileText size={18} />,
    },
  ];

  const logout = () => {
    localStorage.removeItem("networkAttackUser");
    navigate("/");
  };

  const filteredAttacks = attacks.filter((attack) =>
    attack.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}

      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>

        <div className="sidebar-logo">

          <div className="logo-icon">
            <ShieldCheck size={20} />
          </div>

          <span>
            Network<span className="logo-accent">Attack</span>
          </span>

          <button
            className="close-sidebar"
            onClick={() => setMobileMenu(false)}
          >
            <X size={19} />
          </button>

        </div>


        <div className="sidebar-section">

          <span className="sidebar-label">
            MAIN MENU
          </span>

          {menuItems.map((item) => (

            <button
              key={item.name}
              className={`sidebar-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                setMobileMenu(false);
              }}
            >

              {item.icon}

              <span>{item.name}</span>

              {item.name === "Threat Alerts" && (
                <b className="notification-count">3</b>
              )}

            </button>

          ))}

        </div>


        <div className="sidebar-bottom">

          <button
            className={`sidebar-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>


          <button
            className="sidebar-item logout-item"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <main className="dashboard-main">

        <header className="dashboard-topbar">

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={21} />
          </button>


          <div className="topbar-search">

            <Search size={17} />

            <input
              placeholder="Search threats, IP addresses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>


          <div className="topbar-right">

            <button className="icon-button">
              <Bell size={19} />
              <span className="bell-dot"></span>
            </button>

            <div className="user-avatar">
              NA
            </div>

          </div>

        </header>


        <div className="dashboard-body">

          {activePage === "Dashboard" && (
            <Overview
              filteredAttacks={filteredAttacks}
            />
          )}

          {activePage === "Network Monitor" && (
            <NetworkMonitor />
          )}

          {activePage === "Attack Detection" && (
            <AttackDetection />
          )}

          {activePage === "Threat Alerts" && (
            <ThreatAlerts />
          )}

          {activePage === "Analytics" && (
            <Analytics />
          )}

          {activePage === "Reports" && (
            <Reports />
          )}

          {activePage === "Settings" && (
            <SettingsPage />
          )}

        </div>

      </main>

    </div>
  );
}


/* ================= OVERVIEW ================= */

function Overview({ filteredAttacks }) {
  return (
    <>
      <PageHeader
        label="SECURITY OVERVIEW"
        title="Network Dashboard"
        text="Monitor your network security in real time."
      />

      <div className="dashboard-status">
        <CheckCircle size={16} />
        All systems operational
      </div>


      <section className="stats-grid">

        <StatCard
          title="Network Status"
          value="Protected"
          text="All systems operational"
          icon={<ShieldCheck />}
          type="good"
        />

        <StatCard
          title="Threats Detected"
          value="24"
          text="Last 24 hours"
          icon={<ShieldAlert />}
          type="warning"
        />

        <StatCard
          title="Critical Alerts"
          value="03"
          text="Requires attention"
          icon={<AlertTriangle />}
          type="danger"
        />

        <StatCard
          title="Traffic Analyzed"
          value="1.8M"
          text="Packets processed"
          icon={<Activity />}
          type="blue"
        />

      </section>


      <section className="dashboard-grid">

        <div className="panel traffic-panel">

          <div className="panel-heading">

            <div>
              <h2>Network Activity</h2>
              <p>Traffic volume over the last hour</p>
            </div>

            <span className="live-label">
              <span></span>
              LIVE
            </span>

          </div>


          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={trafficData}>

                <defs>
                  <linearGradient
                    id="trafficGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopOpacity={0.25} />
                    <stop offset="100%" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="traffic"
                  strokeWidth={2}
                  fill="url(#trafficGradient)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>


        <ThreatPanel attacks={filteredAttacks} />

      </section>


      <section className="network-summary">

        <div className="panel summary-large">

          <div className="panel-heading">
            <div>
              <h2>Network Health</h2>
              <p>Current infrastructure status</p>
            </div>

            <Wifi size={21} />
          </div>


          <div className="health-bar">

            <div style={{ width: "92%" }}></div>

          </div>

          <div className="health-details">

            <strong>92%</strong>

            <span>
              Excellent network health
            </span>

          </div>

        </div>


        <div className="panel quick-panel">

          <h2>Quick Actions</h2>

          <button>
            <Activity size={17} />
            Start Network Scan
            <ChevronRight size={16} />
          </button>

          <button>
            <FileText size={17} />
            Generate Report
            <ChevronRight size={16} />
          </button>

          <button>
            <ShieldAlert size={17} />
            Review Threats
            <ChevronRight size={16} />
          </button>

        </div>

      </section>
    </>
  );
}


/* ================= NETWORK MONITOR ================= */

function NetworkMonitor() {
  return (
    <>
      <PageHeader
        label="NETWORK MONITOR"
        title="Live Network Monitoring"
        text="Track network traffic and connected infrastructure."
      />

      <div className="monitor-grid">

        <div className="panel network-monitor-visual">

          <div className="panel-heading">

            <div>
              <h2>Network Topology</h2>
              <p>Active network connections</p>
            </div>

            <button className="refresh-btn">
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>


          <div className="topology">

            <div className="topology-line line-one"></div>
            <div className="topology-line line-two"></div>
            <div className="topology-line line-three"></div>

            <div className="topology-node server">
              <ShieldCheck size={22} />
              <span>Server</span>
            </div>

            <div className="topology-node device-one">
              <Wifi size={19} />
              <span>Device 01</span>
            </div>

            <div className="topology-node device-two">
              <Wifi size={19} />
              <span>Device 02</span>
            </div>

            <div className="topology-node device-three">
              <Wifi size={19} />
              <span>Device 03</span>
            </div>

          </div>

        </div>


        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>Network Metrics</h2>
              <p>Current performance</p>
            </div>
          </div>

          <Metric
            title="Bandwidth Usage"
            value="68%"
          />

          <Metric
            title="Active Connections"
            value="148"
          />

          <Metric
            title="Packets / Second"
            value="12.4K"
          />

          <Metric
            title="Latency"
            value="18 ms"
          />

        </div>

      </div>
    </>
  );
}


/* ================= ATTACK DETECTION ================= */

function AttackDetection() {
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);

    setTimeout(() => {
      setScanning(false);
      alert("Network scan completed. No new critical threats found.");
    }, 2000);
  };

  return (
    <>
      <PageHeader
        label="THREAT DETECTION"
        title="Attack Detection"
        text="Scan your network and identify suspicious activity."
      />

      <div className="detection-layout">

        <div className="panel scan-card">

          <div className="scan-icon">
            <ShieldAlert size={32} />
          </div>

          <h2>Network Security Scan</h2>

          <p>
            Run a complete network scan to identify suspicious
            connections, abnormal traffic and potential attacks.
          </p>

          <button
            className="primary-btn"
            onClick={startScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <RefreshCw size={17} className="spin" />
                Scanning Network...
              </>
            ) : (
              <>
                <ShieldAlert size={17} />
                Start Security Scan
              </>
            )}
          </button>

        </div>


        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>Detection Engine</h2>
              <p>Current detection capabilities</p>
            </div>
          </div>

          <DetectionRow
            name="Port Scanning"
            status="Active"
          />

          <DetectionRow
            name="Brute Force"
            status="Active"
          />

          <DetectionRow
            name="SQL Injection"
            status="Active"
          />

          <DetectionRow
            name="DDoS Activity"
            status="Active"
          />

          <DetectionRow
            name="Suspicious Traffic"
            status="Active"
          />

        </div>

      </div>
    </>
  );
}


/* ================= ALERTS ================= */

function ThreatAlerts() {
  return (
    <>
      <PageHeader
        label="SECURITY ALERTS"
        title="Threat Alerts"
        text="Review and manage detected security incidents."
      />

      <div className="alerts-list">

        {attacks.map((attack, index) => (

          <div className="alert-card" key={index}>

            <div className={`alert-icon ${attack.severity.toLowerCase()}`}>
              <ShieldAlert size={20} />
            </div>

            <div className="alert-main">

              <div>
                <h3>{attack.type}</h3>
                <span>{attack.source}</span>
              </div>

              <div className={`severity ${attack.severity.toLowerCase()}`}>
                {attack.severity}
              </div>

            </div>

            <span className="alert-time">
              {attack.time}
            </span>

            <button className="view-alert">
              View
              <ChevronRight size={16} />
            </button>

          </div>

        ))}

      </div>
    </>
  );
}


/* ================= ANALYTICS ================= */

function Analytics() {
  return (
    <>
      <PageHeader
        label="SECURITY ANALYTICS"
        title="Analytics"
        text="Understand network activity and attack trends."
      />

      <div className="analytics-cards">

        <StatCard
          title="Total Attacks"
          value="124"
          text="+12% this week"
          icon={<ShieldAlert />}
          type="warning"
        />

        <StatCard
          title="Blocked Threats"
          value="118"
          text="95.1% success rate"
          icon={<CheckCircle />}
          type="good"
        />

        <StatCard
          title="Average Response"
          value="1.8s"
          text="Improved by 14%"
          icon={<Activity />}
          type="blue"
        />

      </div>


      <div className="panel analytics-chart">

        <div className="panel-heading">

          <div>
            <h2>Traffic & Threat Activity</h2>
            <p>Network activity analysis</p>
          </div>

        </div>

        <div className="chart-container">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={trafficData}>

              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              <Area
                type="monotone"
                dataKey="traffic"
                fill="none"
                strokeWidth={2}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>
    </>
  );
}


/* ================= REPORTS ================= */

function Reports() {
  const generateReport = () => {
    alert(
      "Security report generated successfully. Download functionality will be connected to the backend."
    );
  };

  return (
    <>
      <PageHeader
        label="SECURITY REPORTING"
        title="Reports"
        text="Generate and review network security reports."
      />

      <div className="report-grid">

        <div className="panel report-card">

          <div className="report-icon">
            <FileText size={25} />
          </div>

          <h2>Network Security Report</h2>

          <p>
            Summary of network activity, threats and security events.
          </p>

          <button
            className="primary-btn"
            onClick={generateReport}
          >
            Generate Report
            <FileText size={16} />
          </button>

        </div>


        <div className="panel report-history">

          <div className="panel-heading">
            <div>
              <h2>Recent Reports</h2>
              <p>Previously generated reports</p>
            </div>
          </div>

          <div className="report-row">
            <FileText size={17} />
            Weekly Security Report
            <span>PDF</span>
          </div>

          <div className="report-row">
            <FileText size={17} />
            Network Activity Report
            <span>PDF</span>
          </div>

          <div className="report-row">
            <FileText size={17} />
            Threat Analysis Report
            <span>PDF</span>
          </div>

        </div>

      </div>
    </>
  );
}


/* ================= SETTINGS ================= */

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [monitoring, setMonitoring] = useState(true);

  return (
    <>
      <PageHeader
        label="SYSTEM SETTINGS"
        title="Settings"
        text="Manage your security platform preferences."
      />

      <div className="settings-panel panel">

        <SettingRow
          title="Real-time Monitoring"
          text="Keep network activity monitoring enabled."
          enabled={monitoring}
          setEnabled={setMonitoring}
        />

        <SettingRow
          title="Threat Notifications"
          text="Receive alerts when suspicious activity is detected."
          enabled={notifications}
          setEnabled={setNotifications}
        />

        <SettingRow
          title="Automatic Threat Analysis"
          text="Automatically analyze newly detected threats."
          enabled={true}
          setEnabled={() => {}}
        />

      </div>
    </>
  );
}


/* ================= COMPONENTS ================= */

function PageHeader({ label, title, text }) {
  return (
    <div className="page-header">

      <div>
        <span>{label}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>

    </div>
  );
}


function StatCard({ title, value, text, icon, type }) {
  return (
    <div className="stat-card">

      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <div className="stat-info">

        <span>{title}</span>

        <strong>{value}</strong>

        <small>{text}</small>

      </div>

    </div>
  );
}


function ThreatPanel({ attacks }) {
  return (
    <div className="panel threats-panel">

      <div className="panel-heading">

        <div>
          <h2>Recent Threats</h2>
          <p>Latest detected attacks</p>
        </div>

        <button>
          View all
          <ChevronRight size={15} />
        </button>

      </div>


      {attacks.length === 0 ? (

        <div className="empty-state">
          No threats found.
        </div>

      ) : (

        attacks.map((attack, index) => (

          <div className="threat-row" key={index}>

            <div className="threat-info">

              <div className={`threat-dot ${attack.severity.toLowerCase()}`}></div>

              <div>
                <strong>{attack.type}</strong>
                <span>{attack.source}</span>
              </div>

            </div>

            <div className="threat-right">

              <span className={`severity ${attack.severity.toLowerCase()}`}>
                {attack.severity}
              </span>

              <small>{attack.time}</small>

            </div>

          </div>

        ))

      )}

    </div>
  );
}


function Metric({ title, value }) {
  return (
    <div className="metric-row">

      <span>{title}</span>

      <strong>{value}</strong>

    </div>
  );
}


function DetectionRow({ name, status }) {
  return (
    <div className="detection-row">

      <div>
        <ShieldCheck size={17} />
        <span>{name}</span>
      </div>

      <span className="active-status">
        ● {status}
      </span>

    </div>
  );
}


function SettingRow({ title, text, enabled, setEnabled }) {
  return (
    <div className="setting-row">

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

      <button
        className={`toggle ${enabled ? "on" : ""}`}
        onClick={() => setEnabled(!enabled)}
      >
        <span></span>
      </button>

    </div>
  );
}

export default Dashboard;