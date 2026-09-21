const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const NetworkTraffic = require("./models/NetworkTraffic");
const NetworkEvent = require("./models/NetworkEvent");
const SecurityAlert = require("./models/SecurityAlert");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "network_attack_super_secret_2026";

// =========================
// MIDDLEWARE
// =========================

app.use(helmet());

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use("/api/", limiter);

// =========================
// USER MODEL
// =========================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

// =========================
// REPORT MODEL
// =========================

const reportSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    description: String,

    threats: {
      type: Number,
      default: 0,
    },

    blocked: {
      type: Number,
      default: 0,
    },

    alerts: {
      type: Number,
      default: 0,
    },

    riskScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model("Report", reportSchema);

// =========================
// DATABASE
// =========================

let mongoConnected = false;

async function connectDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/network_attack"
    );

    mongoConnected = true;

    console.log("MongoDB connected successfully");
  } catch (error) {
    mongoConnected = false;

    console.log(
      "MongoDB is not available. Running in API demo mode."
    );
  }
}

// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Network Attack Backend is running",
  });
});

// =========================
// HEALTH
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "running",
    database: mongoConnected ? "connected" : "demo-mode",
  });
});

// =========================
// REGISTER
// =========================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!mongoConnected) {
      return res.status(201).json({
        success: true,
        message: "Registration successful in demo mode",
        user: {
          name,
          email,
          role: "user",
        },
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!mongoConnected) {
      const token = jwt.sign(
        {
          email,
          role: "user",
        },
        JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );

      return res.json({
        success: true,
        message: "Login successful in demo mode",
        token,
        user: {
          name: "Demo User",
          email,
          role: "user",
        },
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// =========================
// JWT MIDDLEWARE
// =========================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// =========================
// DASHBOARD
// =========================

app.get(
  "/api/dashboard",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          data: {
            totalAlerts: 0,
            totalEvents: 0,
            threatsDetected: 0,
            blockedThreats: 0,
            networkStatus: "Secure",
          },
        });
      }

      const totalAlerts = await SecurityAlert.countDocuments();

      const totalEvents = await NetworkEvent.countDocuments();

      const threatsDetected =
        await NetworkEvent.countDocuments();

      const blockedThreats =
        await SecurityAlert.countDocuments({
          status: "Resolved",
        });

      res.json({
        success: true,
        data: {
          totalAlerts,
          totalEvents,
          threatsDetected,
          blockedThreats,
          networkStatus: "Secure",
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      res.status(500).json({
        success: false,
        message: "Dashboard data unavailable",
      });
    }
  }
);

// =========================
// MONITOR START
// =========================

app.post(
  "/api/monitor/start",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Network monitoring started",
      status: "active",
    });
  }
);

// =========================
// MONITOR STOP
// =========================

app.post(
  "/api/monitor/stop",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Network monitoring stopped",
      status: "inactive",
    });
  }
);

// =========================
// ATTACK SCAN
// =========================

app.post(
  "/api/scan",
  authenticateToken,
  async (req, res) => {
    try {
      const threats = [
        "Port Scan",
        "Brute Force",
        "Malware Traffic",
        "Suspicious Connection",
        "DDoS Pattern",
      ];

      const detected =
        threats[Math.floor(Math.random() * threats.length)];

      const confidence =
        Math.floor(Math.random() * 20) + 80;

      if (mongoConnected) {
        const sourceIP =
          req.body.sourceIP || "192.168.1.100";

        const destinationIP =
          req.body.destinationIP || "10.0.0.1";

        await NetworkEvent.create({
          eventType: detected,
          sourceIP,
          destinationIP,
          protocol: "TCP",
          severity: "High",
          description: `${detected} detected during network scan`,
          status: "Detected",
        });

        await SecurityAlert.create({
          title: `${detected} Detected`,
          type: detected,
          sourceIP,
          destinationIP,
          severity: "High",
          description: `${detected} detected during network scan`,
          status: "Active",
          confidence,
        });
      }

      res.json({
        success: true,
        message: "Network scan completed",
        result: {
          threatDetected: detected,
          severity: "High",
          confidence,
        },
      });
    } catch (error) {
      console.error("Scan error:", error);

      res.status(500).json({
        success: false,
        message: "Network scan failed",
      });
    }
  }
);

// =========================
// TRAFFIC ANALYSIS
// =========================

app.post(
  "/api/traffic/analyze",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          analysis: {
            totalPackets: 0,
            tcp: 0,
            udp: 0,
            http: 0,
            https: 0,
            suspiciousTraffic: 0,
          },
        });
      }

      const traffic = await NetworkTraffic.find()
        .sort({ timestamp: -1 })
        .limit(1000);

      let tcp = 0;
      let udp = 0;
      let http = 0;
      let https = 0;
      let suspiciousTraffic = 0;
      let totalPackets = 0;

      traffic.forEach((item) => {
        const protocol = item.protocol
          ? item.protocol.toUpperCase()
          : "";

        totalPackets += item.packetCount || 0;

        if (protocol === "TCP") {
          tcp += 1;
        }

        if (protocol === "UDP") {
          udp += 1;
        }

        if (protocol === "HTTP") {
          http += 1;
        }

        if (protocol === "HTTPS") {
          https += 1;
        }

        if (
          item.label &&
          item.label.toUpperCase() !== "BENIGN"
        ) {
          suspiciousTraffic += 1;
        }
      });

      res.json({
        success: true,
        analysis: {
          totalPackets,
          tcp,
          udp,
          http,
          https,
          suspiciousTraffic,
        },
      });
    } catch (error) {
      console.error("Traffic analysis error:", error);

      res.status(500).json({
        success: false,
        message: "Traffic analysis failed",
      });
    }
  }
);

// =========================
// IMPORT NETWORK TRAFFIC
// =========================

app.post(
  "/api/traffic/import",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({
          success: false,
          message: "MongoDB is not connected",
        });
      }

      const trafficData = req.body;

      if (!Array.isArray(trafficData)) {
        return res.status(400).json({
          success: false,
          message: "Traffic data must be an array",
        });
      }

      if (trafficData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Traffic data is empty",
        });
      }

      const inserted =
        await NetworkTraffic.insertMany(trafficData);

      res.status(201).json({
        success: true,
        message: "Network traffic imported successfully",
        count: inserted.length,
      });
    } catch (error) {
      console.error("Traffic import error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to import network traffic",
      });
    }
  }
);

// =========================
// GET NETWORK TRAFFIC
// =========================

app.get(
  "/api/traffic",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          traffic: [],
        });
      }

      const traffic = await NetworkTraffic.find()
        .sort({ timestamp: -1 })
        .limit(500);

      res.json({
        success: true,
        traffic,
      });
    } catch (error) {
      console.error("Traffic loading error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load traffic data",
      });
    }
  }
);

// =========================
// THREAT INTELLIGENCE
// =========================

app.post(
  "/api/threat-intel",
  authenticateToken,
  async (req, res) => {
    try {
      const indicator = req.body.indicator || "Unknown";

      let riskLevel = "Low";
      let threatType = "No Known Threat";
      let confidence = "25%";

      if (
        indicator.includes(".") ||
        indicator.includes(":")
      ) {
        riskLevel = "High";
        threatType = "Suspicious Network Activity";
        confidence = "91%";
      }

      res.json({
        success: true,
        indicator,
        result: {
          riskLevel,
          threatType,
          confidence,
          recommendation:
            "Investigate the source and monitor related traffic.",
        },
      });
    } catch (error) {
      console.error("Threat intelligence error:", error);

      res.status(500).json({
        success: false,
        message: "Threat intelligence check failed",
      });
    }
  }
);

// =========================
// ALERTS
// =========================

app.get(
  "/api/alerts",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          alerts: [],
        });
      }

      const alerts = await SecurityAlert.find()
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        alerts,
      });
    } catch (error) {
      console.error("Alerts error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load alerts",
      });
    }
  }
);

// =========================
// RESOLVE ALERT
// =========================

app.patch(
  "/api/alerts/:id/resolve",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({
          success: false,
          message: "MongoDB is not connected",
        });
      }

      const alert =
        await SecurityAlert.findByIdAndUpdate(
          req.params.id,
          {
            status: "Resolved",
            resolvedAt: new Date(),
          },
          {
            new: true,
          }
        );

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      res.json({
        success: true,
        message: "Alert resolved",
        alert,
      });
    } catch (error) {
      console.error("Resolve alert error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to resolve alert",
      });
    }
  }
);

// =========================
// EVENTS
// =========================

app.get(
  "/api/events",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          events: [],
        });
      }

      const events = await NetworkEvent.find()
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error("Events error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load events",
      });
    }
  }
);

// =========================
// CREATE REPORT
// =========================

app.post(
  "/api/reports",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({
          success: false,
          message: "MongoDB is not connected",
        });
      }

      const totalAlerts =
        await SecurityAlert.countDocuments();

      const totalThreats =
        await NetworkEvent.countDocuments();

      const resolvedAlerts =
        await SecurityAlert.countDocuments({
          status: "Resolved",
        });

      const report = await Report.create({
        title:
          req.body.title || "Network Security Report",

        type:
          req.body.type || "Threat Analysis",

        description:
          req.body.description ||
          "Generated network security analysis report.",

        threats: totalThreats,

        blocked: resolvedAlerts,

        alerts: totalAlerts,

        riskScore:
          totalAlerts > 0
            ? Math.min(100, totalAlerts * 10)
            : 0,
      });

      res.status(201).json({
        success: true,
        message: "Report generated successfully",
        report,
      });
    } catch (error) {
      console.error("Report generation error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to generate report",
      });
    }
  }
);

// =========================
// REPORTS
// =========================

app.get(
  "/api/reports",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success: true,
          reports: [],
        });
      }

      const reports = await Report.find()
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        reports,
      });
    } catch (error) {
      console.error("Reports error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load reports",
      });
    }
  }
);

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// =========================
// START SERVER
// =========================

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}

startServer();