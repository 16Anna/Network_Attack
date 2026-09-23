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
const { predictAttack } = require("./services/mlService");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "network_attack_super_secret_2026";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/network_attack";


// =========================================================
// MIDDLEWARE
// =========================================================

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


// =========================================================
// USER MODEL
// =========================================================

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

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);


// =========================================================
// SECURITY REPORT MODEL
// =========================================================

const securityReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Network Security Report",
    },

    type: {
      type: String,
      default: "Network Security Report",
    },

    totalTraffic: {
      type: Number,
      default: 0,
    },

    totalEvents: {
      type: Number,
      default: 0,
    },

    activeAlerts: {
      type: Number,
      default: 0,
    },

    resolvedAlerts: {
      type: Number,
      default: 0,
    },

    threatsDetected: {
      type: Number,
      default: 0,
    },

    highRiskThreats: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      default: "Low",
    },
  },
  {
    timestamps: true,
  }
);

const SecurityReport =
  mongoose.models.SecurityReport ||
  mongoose.model(
    "SecurityReport",
    securityReportSchema
  );


// =========================================================
// DATABASE
// =========================================================

let mongoConnected = false;

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);

    mongoConnected = true;

    console.log(
      "MongoDB connected successfully"
    );
  } catch (error) {
    mongoConnected = false;

    console.error(
      "MongoDB connection error:",
      error.message
    );
  }
}


// =========================================================
// ROOT
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Network Attack Backend is running",
  });
});


// =========================================================
// HEALTH
// =========================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,

    server: "running",

    database: mongoConnected
      ? "connected"
      : "disconnected",
  });
});


// =========================================================
// AUTHENTICATION
// =========================================================

function authenticateToken(req, res, next) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message:
        "Authorization token required",
    });
  }

  const parts =
    authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid authorization format",
    });
  }

  const token = parts[1];

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
}


// =========================================================
// REGISTER
// =========================================================

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      if (!mongoConnected) {
        const token =
          jwt.sign(
            {
              email,
              role: "user",
            },
            JWT_SECRET,
            {
              expiresIn: "2h",
            }
          );

        return res.status(201).json({
          success: true,

          message:
            "Registration successful in demo mode",

          token,

          user: {
            name,
            email,
            role: "user",
          },
        });
      }

      const normalizedEmail =
        email.toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "User already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        await User.create({
          name,

          email: normalizedEmail,

          password:
            hashedPassword,

          role: "user",
        });

      res.status(201).json({
        success: true,

        message:
          "Registration successful",

        user: {
          id: user._id,

          name: user.name,

          email: user.email,

          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Registration failed",
      });
    }
  }
);


// =========================================================
// LOGIN
// =========================================================

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }

      if (!mongoConnected) {
        const token =
          jwt.sign(
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

          message:
            "Login successful in demo mode",

          token,

          user: {
            name: "Demo User",

            email,

            role: "user",
          },
        });
      }

      const user =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      const token =
        jwt.sign(
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

        message:
          "Login successful",

        token,

        user: {
          id: user._id,

          name: user.name,

          email: user.email,

          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Login failed",
      });
    }
  }
);


// =========================================================
// DASHBOARD
// =========================================================

app.get(
  "/api/dashboard",
  authenticateToken,
  async (req, res) => {
    try {
      let trafficRecords = 0;

      let totalPackets = 0;

      let totalEvents = 0;

      let activeAlerts = 0;

      let threatsDetected = 0;

      let blockedThreats = 0;

      const protocolCounts = {
        TCP: 0,
        UDP: 0,
        ICMP: 0,
        Other: 0,
      };


      // =====================================================
      // GET REAL DATA FROM MONGODB
      // =====================================================

      if (mongoConnected) {
        const traffic =
          await NetworkTraffic.find({})
            .lean();


        // Number of traffic records
        trafficRecords =
          traffic.length;


        // IMPORTANT:
        // Sum actual packetCount values.
        // We DO NOT use countDocuments()
        // for the Packets value.
        totalPackets =
          traffic.reduce(
            (total, item) => {
              return (
                total +
                Number(
                  item.packetCount || 0
                )
              );
            },
            0
          );


        // Protocol distribution
        traffic.forEach(
          (item) => {
            const protocol =
              String(
                item.protocol ||
                  "Other"
              ).toUpperCase();

            if (
              protocolCounts[
                protocol
              ] !== undefined
            ) {
              protocolCounts[
                protocol
              ]++;
            } else {
              protocolCounts.Other++;
            }
          }
        );


        totalEvents =
          await NetworkEvent.countDocuments();


        activeAlerts =
          await SecurityAlert.countDocuments(
            {
              status: "Active",
            }
          );


        threatsDetected =
          await NetworkEvent.countDocuments(
            {
              eventType: {
                $ne: "BENIGN",
              },
            }
          );


        blockedThreats =
          await SecurityAlert.countDocuments(
            {
              status: "Resolved",
            }
          );
      }


      // =====================================================
      // RISK
      // =====================================================

      let riskLevel = "Low";

      let riskScore = 20;


      if (activeAlerts >= 5) {
        riskLevel = "Critical";

        riskScore = 90;
      } else if (activeAlerts >= 3) {
        riskLevel = "High";

        riskScore = 75;
      } else if (activeAlerts >= 1) {
        riskLevel = "Medium";

        riskScore = 50;
      }


      // =====================================================
      // RESPONSE
      // =====================================================

      res.json({
        success: true,

        monitoring: false,

        data: {
          // ACTUAL PACKET COUNT
          packets: totalPackets,

          totalPackets: totalPackets,

          // Number of MongoDB traffic documents
          trafficRecords:
            trafficRecords,

          totalTraffic:
            trafficRecords,

          threatsDetected:
            threatsDetected,

          threats:
            threatsDetected,

          blockedThreats:
            blockedThreats,

          blocked:
            blockedThreats,

          totalAlerts:
            activeAlerts,

          activeAlerts:
            activeAlerts,

          connections:
            trafficRecords,

          totalEvents:
            totalEvents,

          riskScore:
            riskScore,

          riskLevel:
            riskLevel,

          risk: {
            score: riskScore,

            level: riskLevel,
          },

          networkStatus:
            activeAlerts > 0
              ? "Under Investigation"
              : "Secure",

          protocols:
            protocolCounts,
        },
      });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Dashboard data unavailable",
      });
    }
  }
);


// =========================================================
// NETWORK TRAFFIC
// =========================================================

app.get(
  "/api/traffic",
  authenticateToken,
  async (req, res) => {
    try {
      let traffic = [];

      if (mongoConnected) {
        traffic =
          await NetworkTraffic.find({})
            .sort({
              _id: -1,
            })
            .limit(100)
            .lean();
      }

      res.json({
        success: true,

        traffic,

        data: traffic,
      });
    } catch (error) {
      console.error(
        "Traffic error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load network traffic",
      });
    }
  }
);


// =========================================================
// IMPORT TRAFFIC
// =========================================================

app.post(
  "/api/traffic/import",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({
          success: false,

          message:
            "MongoDB is not connected",
        });
      }

      const records =
        Array.isArray(req.body)
          ? req.body
          : req.body.records;

      if (
        !records ||
        !Array.isArray(records) ||
        records.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Traffic records are required",
        });
      }

      const inserted =
        await NetworkTraffic.insertMany(
          records
        );

      res.status(201).json({
        success: true,

        message:
          "Traffic data imported successfully",

        count:
          inserted.length,

        data:
          inserted,
      });
    } catch (error) {
      console.error(
        "Traffic import error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to import traffic data",
      });
    }
  }
);


// =========================================================
// MONITOR START
// =========================================================

app.post(
  "/api/monitor/start",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,

      monitoring: true,

      status: "active",

      message:
        "Network monitoring started",
    });
  }
);


// =========================================================
// MONITOR STOP
// =========================================================

app.post(
  "/api/monitor/stop",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,

      monitoring: false,

      status: "inactive",

      message:
        "Network monitoring stopped",
    });
  }
);


// =========================================================
// ATTACK SCAN — ML
// =========================================================

app.post(
  "/api/scan",
  authenticateToken,
  async (req, res) => {
    try {
      let trafficData = null;


      // Get newest traffic record
      if (mongoConnected) {
        trafficData =
          await NetworkTraffic.findOne(
            {}
          )
            .sort({
              _id: -1,
            })
            .lean();
      }


      // Default traffic
      if (!trafficData) {
        trafficData = {
          sourceIP:
            req.body?.target ||
            "192.168.1.25",

          destinationIP:
            "10.0.0.20",

          protocol:
            "TCP",

          sourcePort:
            5000,

          destinationPort:
            22,

          packetCount:
            450,

          bytes:
            56000,

          duration:
            25,

          flowRate:
            2240,

          label:
            "Port Scan",
        };
      }


      // =====================================================
      // ML PREDICTION
      // =====================================================

      const prediction =
        await predictAttack(
          trafficData
        );


      const attackType =
        prediction.attackType ||
        prediction.prediction ||
        "Unknown";


      const confidence =
        Number(
          prediction.confidence ||
            0
        );


      const risk =
        prediction.risk ||
        "Unknown";


      // =====================================================
      // SEVERITY
      // =====================================================

      let severity =
        "Low";


      if (
        attackType ===
        "DDoS"
      ) {
        severity =
          "Critical";
      } else if (
        attackType ===
          "Port Scan" ||
        attackType ===
          "Brute Force"
      ) {
        severity =
          "High";
      } else if (
        attackType !==
          "BENIGN" &&
        attackType !==
          "Unknown"
      ) {
        severity =
          "Medium";
      }


      // =====================================================
      // SAVE EVENT + ALERT
      // =====================================================

      let event = null;

      let alert = null;


      if (mongoConnected) {
        event =
          await NetworkEvent.create(
            {
              eventType:
                attackType,

              sourceIP:
                trafficData.sourceIP ||
                "Unknown",

              destinationIP:
                trafficData.destinationIP ||
                "Unknown",

              protocol:
                trafficData.protocol ||
                "TCP",

              severity:

                severity,

              description:
                `${attackType} detected by ML model with ${confidence}% confidence.`,

              status:
                "Detected",
            }
          );


        if (
          attackType !==
            "BENIGN" &&
          attackType !==
            "Unknown"
        ) {
          alert =
            await SecurityAlert.create(
              {
                title:
                  `${attackType} Detected`,

                type:
                  attackType,

                sourceIP:
                  trafficData.sourceIP ||
                  "Unknown",

                destinationIP:
                  trafficData.destinationIP ||
                  "Unknown",

                severity:

                  severity,

                description:
                  `ML model detected ${attackType} with ${confidence}% confidence.`,

                status:
                  "Active",

                confidence:

                  confidence,

                detectedAt:
                  new Date(),
              }
            );
        }
      }


      // =====================================================
      // RESULT
      // =====================================================

      const result = {
        attackType:

          attackType,

        prediction:

          attackType,

        confidence:

          confidence,

        risk:

          risk,

        severity:

          severity,

        sourceIP:

          trafficData.sourceIP,

        destinationIP:

          trafficData.destinationIP,

        protocol:

          trafficData.protocol,

        sourcePort:

          trafficData.sourcePort,

        destinationPort:

          trafficData.destinationPort,

        packetCount:

          trafficData.packetCount,

        bytes:

          trafficData.bytes,

        duration:

          trafficData.duration,

        flowRate:

          trafficData.flowRate,

        status:
          "Detected",

        eventId:
          event?._id ||
          null,

        alertId:
          alert?._id ||
          null,
      };


      res.json({
        success:
          true,

        message:
          `${attackType} detected successfully`,

        result:

          result,

        attack:

          result,
      });
    } catch (error) {
      console.error(
        "Scan error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Network attack scan failed",

        error:
          error.message,
      });
    }
  }
);


// =========================================================
// TRAFFIC ANALYSIS
// =========================================================

app.post(
  "/api/traffic/analyze",
  authenticateToken,
  async (req, res) => {
    try {
      let traffic = [];

      if (mongoConnected) {
        traffic =
          await NetworkTraffic.find({})
            .sort({
              _id: -1,
            })
            .limit(100)
            .lean();
      }


      let totalPackets = 0;

      let totalBytes = 0;

      let suspiciousTraffic = 0;


      traffic.forEach(
        (item) => {
          totalPackets +=
            Number(
              item.packetCount ||
                0
            );

          totalBytes +=
            Number(
              item.bytes ||
                0
            );

          if (
            item.label &&
            item.label !==
              "BENIGN"
          ) {
            suspiciousTraffic++;
          }
        }
      );


      const analysis = {
        totalPackets:

          totalPackets,

        totalBytes:

          totalBytes,

        incoming:

          totalPackets,

        outgoing:

          0,

        suspicious:

          suspiciousTraffic,

        suspiciousTraffic:

          suspiciousTraffic,

        tcp:
          traffic.filter(
            (x) =>
              String(
                x.protocol
              ).toUpperCase() ===
              "TCP"
          ).length,

        udp:
          traffic.filter(
            (x) =>
              String(
                x.protocol
              ).toUpperCase() ===
              "UDP"
          ).length,

        icmp:
          traffic.filter(
            (x) =>
              String(
                x.protocol
              ).toUpperCase() ===
              "ICMP"
          ).length,
      };


      res.json({
        success:

          true,

        message:
          "Traffic analysis completed",

        analysis:

          analysis,

        traffic:

          analysis,
      });
    } catch (error) {
      console.error(
        "Traffic analysis error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Traffic analysis failed",
      });
    }
  }
);


// =========================================================
// THREAT INTELLIGENCE — GET
// =========================================================

app.get(
  "/api/threat-intel",
  authenticateToken,
  async (req, res) => {
    try {
      let threats = [];

      if (mongoConnected) {
        threats =
          await NetworkEvent.find(
            {
              eventType: {
                $ne: "BENIGN",
              },
            }
          )
            .sort({
              _id: -1,
            })
            .limit(50)
            .lean();
      }

      res.json({
        success:
          true,

        threats:

          threats,

        data:

          threats,
      });
    } catch (error) {
      console.error(
        "Threat intelligence error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load threat intelligence",
      });
    }
  }
);


// =========================================================
// THREAT INTELLIGENCE — POST
// =========================================================

app.post(
  "/api/threat-intel",
  authenticateToken,
  async (req, res) => {
    try {
      const target =
        String(
          req.body?.target ||
          req.body?.indicator ||
          ""
        ).trim();


      if (!target) {
        return res.status(400).json({
          success: false,

          message:
            "Please enter an IP address or domain",
        });
      }


      let matchingEvents = [];


      if (mongoConnected) {
        matchingEvents =
          await NetworkEvent.find(
            {
              $or: [
                {
                  sourceIP:
                    target,
                },

                {
                  destinationIP:
                    target,
                },
              ],
            }
          )
            .sort({
              _id: -1,
            })
            .limit(50)
            .lean();
      }


      const threatEvents =
        matchingEvents.filter(
          (event) =>
            event.eventType !==
            "BENIGN"
        );


      let riskScore =
        0;


      if (
        threatEvents.length >
        0
      ) {
        riskScore =
          85;
      } else if (
        matchingEvents.length >
        0
      ) {
        riskScore =
          30;
      } else {
        riskScore =
          10;
      }


      let reputation =
        "Good";

      let category =
        "No Known Threat";


      if (
        riskScore >=
        80
      ) {
        reputation =
          "Malicious";

        category =
          "Network Attack";
      } else if (
        riskScore >=
        50
      ) {
        reputation =
          "Suspicious";

        category =
          "Suspicious Activity";
      }


      const result = {
        target:

          target,

        indicator:

          target,

        riskScore:

          riskScore,

        reputation:

          reputation,

        category:

          category,

        reports:

          threatEvents.length,

        totalEvents:

          matchingEvents.length,

        threats:

          threatEvents,

        lastDetected:
          threatEvents.length >
          0
            ? threatEvents[0]
                .timestamp
            : null,

        recommendation:
          threatEvents.length >
          0
            ? "Investigate the source and monitor related traffic."
            : "Continue monitoring this indicator.",
      };


      res.json({
        success:

          true,

        message:
          "Threat intelligence analysis completed",

        result:

          result,

        data:

          result,
      });
    } catch (error) {
      console.error(
        "Threat intelligence POST error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Threat intelligence analysis failed",
      });
    }
  }
);


// =========================================================
// ALERTS
// =========================================================

app.get(
  "/api/alerts",
  authenticateToken,
  async (req, res) => {
    try {
      let alerts = [];

      if (mongoConnected) {
        alerts =
          await SecurityAlert.find(
            {}
          )
            .sort({
              _id: -1,
            })
            .limit(100)
            .lean();
      }


      res.json({
        success:

          true,

        alerts:

          alerts,

        data:

          alerts,
      });
    } catch (error) {
      console.error(
        "Alerts error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load alerts",
      });
    }
  }
);


// =========================================================
// RESOLVE ALERT
// =========================================================

app.patch(
  "/api/alerts/:id/resolve",
  authenticateToken,
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.json({
          success:
            true,

          message:
            "Alert resolved in demo mode",
        });
      }


      const alert =
        await SecurityAlert.findByIdAndUpdate(
          req.params.id,

          {
            status:
              "Resolved",

            resolvedAt:
              new Date(),
          },

          {
            new: true,
          }
        );


      if (!alert) {
        return res.status(404).json({
          success:
            false,

          message:
            "Alert not found",
        });
      }


      res.json({
        success:

          true,

        message:
          "Alert resolved successfully",

        alert:

          alert,
      });
    } catch (error) {
      console.error(
        "Resolve alert error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to resolve alert",
      });
    }
  }
);


// =========================================================
// EVENTS
// =========================================================

app.get(
  "/api/events",
  authenticateToken,
  async (req, res) => {
    try {
      let events = [];

      if (mongoConnected) {
        events =
          await NetworkEvent.find(
            {}
          )
            .sort({
              _id: -1,
            })
            .limit(100)
            .lean();
      }


      res.json({
        success:

          true,

        events:

          events,

        data:

          events,
      });
    } catch (error) {
      console.error(
        "Events error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load events",
      });
    }
  }
);


// =========================================================
// GENERATE REPORT
// =========================================================

app.post(
  "/api/reports",
  authenticateToken,
  async (req, res) => {
    try {
      let totalTraffic = 0;

      let totalEvents = 0;

      let activeAlerts = 0;

      let resolvedAlerts = 0;

      let threatsDetected = 0;

      let highRiskThreats = 0;


      if (mongoConnected) {
        totalTraffic =
          await NetworkTraffic.countDocuments();


        totalEvents =
          await NetworkEvent.countDocuments();


        activeAlerts =
          await SecurityAlert.countDocuments(
            {
              status:
                "Active",
            }
          );


        resolvedAlerts =
          await SecurityAlert.countDocuments(
            {
              status:
                "Resolved",
            }
          );


        threatsDetected =
          await NetworkEvent.countDocuments(
            {
              eventType: {
                $ne: "BENIGN",
              },
            }
          );


        highRiskThreats =
          await NetworkEvent.countDocuments(
            {
              severity: {
                $in: [
                  "High",
                  "Critical",
                ],
              },
            }
          );
      }


      let riskLevel =
        "Low";


      if (
        highRiskThreats >=
        5
      ) {
        riskLevel =
          "Critical";
      } else if (
        highRiskThreats >=
        3
      ) {
        riskLevel =
          "High";
      } else if (
        highRiskThreats >=
        1
      ) {
        riskLevel =
          "Medium";
      }


      const reportData = {
        title:
          req.body?.type ||
          "Network Security Report",

        type:
          req.body?.type ||
          "Network Security Report",

        totalTraffic:

          totalTraffic,

        totalEvents:

          totalEvents,

        activeAlerts:

          activeAlerts,

        resolvedAlerts:

          resolvedAlerts,

        threatsDetected:

          threatsDetected,

        highRiskThreats:

          highRiskThreats,

        riskLevel:

          riskLevel,
      };


      let savedReport =
        reportData;


      if (mongoConnected) {
        savedReport =
          await SecurityReport.create(
            reportData
          );
      }


      res.json({
        success:

          true,

        message:
          "Security report generated successfully",

        report:

          savedReport,
      });
    } catch (error) {
      console.error(
        "Report generation error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Report generation failed",
      });
    }
  }
);


// =========================================================
// GET REPORTS
// =========================================================

app.get(
  "/api/reports",
  authenticateToken,
  async (req, res) => {
    try {
      let reports = [];

      if (mongoConnected) {
        reports =
          await SecurityReport.find(
            {}
          )
            .sort({
              _id: -1,
            })
            .limit(50)
            .lean();
      }


      res.json({
        success:

          true,

        reports:

          reports,

        data:

          reports,
      });
    } catch (error) {
      console.error(
        "Reports error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Unable to load reports",
      });
    }
  }
);


// =========================================================
// 404
// =========================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success:
        false,

      message:
        "API endpoint not found",

      path:
        req.originalUrl,

      method:
        req.method,
    });
  }
);


// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      err
    );

    res.status(500).json({
      success:
        false,

      message:
        "Internal server error",
    });
  }
);


// =========================================================
// START SERVER
// =========================================================

async function startServer() {
  await connectDatabase();

  app.listen(
    PORT,
    () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    }
  );
}

startServer();