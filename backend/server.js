const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let monitoring = false;

let alerts = [
  {
    id: 1,
    type: "Brute Force",
    source: "192.168.1.45",
    severity: "High",
    time: "2 min ago",
    status: "Active",
  },
  {
    id: 2,
    type: "Port Scan",
    source: "10.0.0.24",
    severity: "Medium",
    time: "8 min ago",
    status: "Active",
  },
  {
    id: 3,
    type: "Suspicious Traffic",
    source: "172.16.0.18",
    severity: "Low",
    time: "15 min ago",
    status: "Active",
  },
];

let stats = {
  packets: 128420,
  threats: 24,
  blocked: 17,
  activeConnections: 86,
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Network Attack Security API is running",
    monitoring,
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  res.json({
    success: true,
    message: "Login successful",
    user: {
      name: email.split("@")[0],
      email,
    },
    token: "network-demo-token",
  });
});

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  res.json({
    success: true,
    message: "Account created successfully",
    user: {
      name,
      email,
    },
  });
});

// Dashboard
app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,
    monitoring,
    stats,
    alerts,
  });
});

// Start monitoring
app.post("/api/monitor/start", (req, res) => {
  monitoring = true;

  res.json({
    success: true,
    monitoring: true,
    message: "Network monitoring started",
  });
});

// Stop monitoring
app.post("/api/monitor/stop", (req, res) => {
  monitoring = false;

  res.json({
    success: true,
    monitoring: false,
    message: "Network monitoring stopped",
  });
});

// Attack scan
app.post("/api/scan", (req, res) => {
  const detected = [
    {
      type: "Port Scanning",
      source: "192.168.1.77",
      destination: "10.0.0.1",
      severity: "High",
      confidence: "94%",
    },
    {
      type: "Brute Force Attempt",
      source: "45.83.21.91",
      destination: "10.0.0.12",
      severity: "Critical",
      confidence: "98%",
    },
    {
      type: "Unusual Data Transfer",
      source: "172.16.4.20",
      destination: "8.8.8.8",
      severity: "Medium",
      confidence: "81%",
    },
  ];

  stats.threats += detected.length;

  res.json({
    success: true,
    message: "Attack scan completed",
    detected,
  });
});

// Traffic analysis
app.post("/api/traffic/analyze", (req, res) => {
  const traffic = {
    totalPackets: 148920,
    incoming: 86420,
    outgoing: 62500,
    suspicious: 1830,
    tcp: 68,
    udp: 24,
    icmp: 8,
  };

  stats.packets = traffic.totalPackets;

  res.json({
    success: true,
    message: "Traffic analysis completed",
    traffic,
  });
});

// Threat intelligence
app.post("/api/threat-intel", (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({
      success: false,
      message: "Enter an IP address or domain",
    });
  }

  res.json({
    success: true,
    target,
    result: {
      reputation: "Suspicious",
      riskScore: 78,
      country: "Unknown",
      category: "Potential Attack Source",
      lastSeen: "Today",
      reports: 14,
    },
  });
});

// Resolve alert
app.post("/api/alerts/:id/resolve", (req, res) => {
  const id = Number(req.params.id);

  const alert = alerts.find((item) => item.id === id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: "Alert not found",
    });
  }

  alert.status = "Resolved";

  res.json({
    success: true,
    message: "Alert resolved",
    alert,
  });
});

// Generate report
app.post("/api/reports", (req, res) => {
  const report = {
    id: `RPT-${Date.now()}`,
    generatedAt: new Date().toLocaleString(),
    threats: stats.threats,
    blocked: stats.blocked,
    packets: stats.packets,
    status: "Generated",
  };

  res.json({
    success: true,
    message: "Security report generated",
    report,
  });
});

app.listen(PORT, () => {
  console.log(`Network Attack backend running on http://localhost:${PORT}`);
});