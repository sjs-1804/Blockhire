const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

/**
 * Health Check and Monitoring System
 * Monitors contract status, IPFS connectivity, and system performance
 */

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "health-checks.log")
    })
  ]
});

class HealthChecker {
  constructor(networkName = "localhost") {
    this.networkName = networkName;
    this.provider = null;
    this.contracts = {};
    this.healthResults = {};
    this.alertThresholds = {
      gasPrice: 100 * 1e9, // 100 gwei
      responseTime: 5000, // 5 seconds
      blockTime: 30000, // 30 seconds
      contractFailureRate: 0.1 // 10%
    };
  }

  async runFullHealthCheck() {
    logger.info(`🏥 Starting full health check for ${this.networkName} network`);

    try {
      await this.initialize();
      await this.checkNetworkStatus();
      await this.checkContractStatus();
      await this.checkIPFSConnectivity();
      await this.checkGasPrices();
      await this.checkResponseTimes();
      await this.checkSystemResources();
      await this.generateHealthReport();
      await this.sendAlertsIfNeeded();

      logger.info("✅ Health check completed successfully");
      return this.healthResults;
    } catch (error) {
      logger.error("❌ Health check failed:", error);
      throw error;
    }
  }

  async initialize() {
    logger.info("🔧 Initializing health checker...");

    // Setup provider
    if (this.networkName === "localhost") {
      this.provider = ethers.provider;
    } else {
      const networkConfigs = {
        sepolia: process.env.SEPOLIA_RPC_URL,
        mainnet: process.env.MAINNET_RPC_URL,
        polygon: process.env.POLYGON_RPC_URL
      };

      const rpcUrl = networkConfigs[this.networkName];
      if (!rpcUrl) {
        throw new Error(`RPC URL not configured for ${this.networkName}`);
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Load deployed contracts
    await this.loadContracts();

    logger.info("✅ Health checker initialized");
  }

  async loadContracts() {
    logger.info("📂 Loading deployed contracts...");

    const deploymentsDir = path.join(__dirname, "..", "..", "deployments");
    const deploymentFile = path.join(deploymentsDir, `${this.networkName}.json`);

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    const addresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

    // Load contract ABIs
    const artifactsDir = path.join(__dirname, "..", "..", "artifacts", "contracts");

    const contractConfigs = [
      { name: "UniversityRegistry", file: "UniversityRegistry.sol/UniversityRegistry.json" },
      { name: "ResumeRegistry", file: "ResumeRegistry.sol/ResumeRegistry.json" },
      { name: "SkillRegistry", file: "SkillRegistry.sol/SkillRegistry.json" },
      { name: "EndorsementRegistry", file: "EndorsementRegistry.sol/EndorsementRegistry.json" },
      { name: "EmployeeRegistry", file: "employeeRegistry.sol/EmployeeRegistry.json" }
    ];

    for (const config of contractConfigs) {
      if (addresses[config.name]) {
        const artifactPath = path.join(artifactsDir, config.file);
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
          this.contracts[config.name] = new ethers.Contract(
            addresses[config.name],
            artifact.abi,
            this.provider
          );
          logger.info(`✅ Loaded ${config.name} at ${addresses[config.name]}`);
        } else {
          logger.warn(`⚠️  Artifact not found for ${config.name}`);
        }
      }
    }
  }

  async checkNetworkStatus() {
    logger.info("🌐 Checking network status...");

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const latestBlock = await this.provider.getBlock("latest");

      this.healthResults.network = {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber,
        latestBlockTimestamp: latestBlock.timestamp,
        status: "healthy",
        responseTime: Date.now()
      };

      // Check if network is syncing
      const timeSinceLastBlock = Date.now() - (latestBlock.timestamp * 1000);
      if (timeSinceLastBlock > this.alertThresholds.blockTime) {
        this.healthResults.network.status = "warning";
        this.healthResults.network.warning = `Time since last block: ${timeSinceLastBlock}ms`;
        logger.warn(`⚠️  Network warning: ${this.healthResults.network.warning}`);
      }

      logger.info(`✅ Network status: ${network.name} (Block: ${blockNumber})`);

    } catch (error) {
      this.healthResults.network = {
        status: "error",
        error: error.message,
        responseTime: Date.now()
      };
      logger.error("❌ Network status check failed:", error.message);
    }
  }

  async checkContractStatus() {
    logger.info("📋 Checking contract status...");

    this.healthResults.contracts = {};

    for (const [name, contract] of Object.entries(this.contracts)) {
      try {
        const startTime = Date.now();

        // Basic contract call to test connectivity
        let result;
        if (name === "UniversityRegistry") {
          result = await contract.getUniversityCount();
        } else if (name === "ResumeRegistry") {
          result = await contract.getStudentCount();
        } else if (name === "SkillRegistry") {
          result = await contract.getTestCount();
        } else if (name === "EndorsementRegistry") {
          result = await contract.getEndorsementCount();
        } else if (name === "EmployeeRegistry") {
          result = await contract.getEmployerCount();
        }

        const responseTime = Date.now() - startTime;

        this.healthResults.contracts[name] = {
          address: await contract.getAddress(),
          status: "healthy",
          responseTime,
          lastCheck: new Date().toISOString(),
          data: result ? result.toString() : null
        };

        if (responseTime > this.alertThresholds.responseTime) {
          this.healthResults.contracts[name].status = "warning";
          this.healthResults.contracts[name].warning = `High response time: ${responseTime}ms`;
          logger.warn(`⚠️  ${name} response time warning: ${responseTime}ms`);
        }

        logger.info(`✅ ${name}: Healthy (${responseTime}ms)`);

      } catch (error) {
        this.healthResults.contracts[name] = {
          address: await contract.getAddress(),
          status: "error",
          error: error.message,
          lastCheck: new Date().toISOString()
        };
        logger.error(`❌ ${name} status check failed:`, error.message);
      }
    }

    const totalContracts = Object.keys(this.contracts).length;
    const healthyContracts = Object.values(this.healthResults.contracts)
      .filter(c => c.status === "healthy").length;

    this.healthResults.contracts.summary = {
      total: totalContracts,
      healthy: healthyContracts,
      unhealthy: totalContracts - healthyContracts,
      healthPercentage: totalContracts > 0 ? (healthyContracts / totalContracts * 100).toFixed(2) + "%" : "0%"
    };
  }

  async checkIPFSConnectivity() {
    logger.info("📁 Checking IPFS connectivity...");

    this.healthResults.ipfs = {
      gateways: [],
      status: "unknown"
    };

    const gateways = [
      "https://ipfs.io/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/"
    ];

    const testCID = "QmaQwYWpchozXhFv8nvxprECWBSCEppN9dfd2VQiJfRo3F"; // Valid test CID

    for (const gateway of gateways) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${gateway}${testCID}`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          this.healthResults.ipfs.gateways.push({
            url: gateway,
            status: "healthy",
            responseTime,
            statusCode: response.status
          });
          logger.info(`✅ IPFS Gateway ${gateway}: Healthy (${responseTime}ms)`);
        } else {
          this.healthResults.ipfs.gateways.push({
            url: gateway,
            status: "error",
            statusCode: response.status,
            error: `HTTP ${response.status}`
          });
          logger.warn(`⚠️  IPFS Gateway ${gateway}: HTTP ${response.status}`);
        }
      } catch (error) {
        this.healthResults.ipfs.gateways.push({
          url: gateway,
          status: "error",
          error: error.message
        });
        logger.error(`❌ IPFS Gateway ${gateway}:`, error.message);
      }
    }

    const healthyGateways = this.healthResults.ipfs.gateways.filter(g => g.status === "healthy").length;

    if (healthyGateways === 0) {
      this.healthResults.ipfs.status = "error";
      this.healthResults.ipfs.error = "All IPFS gateways are down";
    } else if (healthyGateways < gateways.length) {
      this.healthResults.ipfs.status = "warning";
      this.healthResults.ipfs.warning = `${gateways.length - healthyGateways} gateways are down`;
    } else {
      this.healthResults.ipfs.status = "healthy";
    }

    logger.info(`✅ IPFS connectivity check: ${this.healthResults.ipfs.status}`);
  }

  async checkGasPrices() {
    logger.info("⛽ Checking gas prices...");

    try {
      const gasPrice = await this.provider.getFeeData();
      const currentGasPrice = gasPrice.gasPrice || 0n;

      this.healthResults.gas = {
        currentGasPrice: currentGasPrice.toString(),
        currentGasPriceGwei: ethers.formatUnits(currentGasPrice, "gwei"),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString() || "0",
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString() || "0",
        status: "normal"
      };

      const gasPriceGwei = parseFloat(this.healthResults.gas.currentGasPriceGwei);
      const thresholdGwei = ethers.formatUnits(this.alertThresholds.gasPrice, "gwei");

      if (gasPriceGwei > parseFloat(thresholdGwei)) {
        this.healthResults.gas.status = "warning";
        this.healthResults.gas.warning = `High gas price: ${gasPriceGwei.toFixed(2)} gwei`;
        logger.warn(`⚠️  High gas price: ${gasPriceGwei.toFixed(2)} gwei`);
      }

      logger.info(`✅ Gas price: ${gasPriceGwei.toFixed(2)} gwei`);

    } catch (error) {
      this.healthResults.gas = {
        status: "error",
        error: error.message
      };
      logger.error("❌ Gas price check failed:", error.message);
    }
  }

  async checkResponseTimes() {
    logger.info("⏱️ Checking response times...");

    this.healthResults.responseTimes = {
      network: 0,
      contracts: {},
      average: 0,
      status: "healthy"
    };

    const times = [];

    // Check network response time
    const networkStart = Date.now();
    await this.provider.getBlockNumber();
    const networkTime = Date.now() - networkStart;
    times.push(networkTime);
    this.healthResults.responseTimes.network = networkTime;

    // Check contract response times
    for (const [name, contract] of Object.entries(this.contracts)) {
      try {
        const contractStart = Date.now();

        // Simple read operation
        if (name === "UniversityRegistry") {
          await contract.getUniversityCount();
        } else {
          await contract.getAddress(); // Fallback to simple address call
        }

        const contractTime = Date.now() - contractStart;
        times.push(contractTime);
        this.healthResults.responseTimes.contracts[name] = contractTime;

      } catch (error) {
        logger.warn(`⚠️  ${name} response time check failed:`, error.message);
      }
    }

    // Calculate average
    if (times.length > 0) {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      this.healthResults.responseTimes.average = Math.round(averageTime);

      if (averageTime > this.alertThresholds.responseTime) {
        this.healthResults.responseTimes.status = "warning";
        this.healthResults.responseTimes.warning = `High average response time: ${averageTime}ms`;
        logger.warn(`⚠️  High average response time: ${averageTime}ms`);
      }
    }

    logger.info(`✅ Average response time: ${this.healthResults.responseTimes.average}ms`);
  }

  async checkSystemResources() {
    logger.info("💻 Checking system resources...");

    this.healthResults.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      status: "healthy"
    };

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    this.healthResults.system.memory = memoryUsageMB;

    // Warning if memory usage is high (>500MB)
    if (memoryUsageMB.heapUsed > 500) {
      this.healthResults.system.status = "warning";
      this.healthResults.system.warning = `High memory usage: ${memoryUsageMB.heapUsed}MB`;
      logger.warn(`⚠️  High memory usage: ${memoryUsageMB.heapUsed}MB`);
    }

    logger.info(`✅ System resources - Memory: ${memoryUsageMB.heapUsed}MB, Uptime: ${Math.round(process.uptime())}s`);
  }

  async generateHealthReport() {
    logger.info("📊 Generating health report...");

    const report = {
      timestamp: new Date().toISOString(),
      network: this.networkName,
      overallStatus: "healthy",
      summary: {
        networkStatus: this.healthResults.network?.status || "unknown",
        contractsHealthy: this.healthResults.contracts?.summary?.healthy || 0,
        contractsTotal: this.healthResults.contracts?.summary?.total || 0,
        ipfsStatus: this.healthResults.ipfs?.status || "unknown",
        gasStatus: this.healthResults.gas?.status || "unknown",
        averageResponseTime: this.healthResults.responseTimes?.average || 0
      },
      details: this.healthResults
    };

    // Determine overall status
    const hasErrors = Object.values(this.healthResults).some(result =>
      result && typeof result === 'object' && result.status === 'error'
    );
    const hasWarnings = Object.values(this.healthResults).some(result =>
      result && typeof result === 'object' && result.status === 'warning'
    );

    if (hasErrors) {
      report.overallStatus = "error";
    } else if (hasWarnings) {
      report.overallStatus = "warning";
    }

    // Save report
    const reportsDir = path.join(__dirname, "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(reportsDir, `health-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Also save latest report
    const latestReportFile = path.join(reportsDir, "latest-health-report.json");
    fs.writeFileSync(latestReportFile, JSON.stringify(report, null, 2));

    this.healthResults.report = report;

    logger.info(`✅ Health report generated: ${report.overallStatus}`);
  }

  async sendAlertsIfNeeded() {
    if (this.healthResults.report.overallStatus === "healthy") {
      return; // No alerts needed
    }

    logger.info(`🚨 Sending alerts for ${this.healthResults.report.overallStatus} status`);

    const alert = {
      timestamp: new Date().toISOString(),
      network: this.networkName,
      status: this.healthResults.report.overallStatus,
      summary: this.generateAlertSummary(),
      details: this.healthResults
    };

    // Log alert
    logger.error("🚨 HEALTH ALERT", alert);

    // Here you could integrate with various alerting systems:
    // - Email notifications
    // - Slack notifications
    // - Discord notifications
    // - PagerDuty alerts
    // - Custom webhooks

    await this.saveAlert(alert);
    logger.info("✅ Alert sent and saved");
  }

  generateAlertSummary() {
    const summary = [];

    if (this.healthResults.network?.status === "error") {
      summary.push("Network connection failed");
    }

    if (this.healthResults.contracts?.summary?.unhealthy > 0) {
      summary.push(`${this.healthResults.contracts.summary.unhealthy} contracts are unhealthy`);
    }

    if (this.healthResults.ipfs?.status === "error") {
      summary.push("IPFS connectivity failed");
    }

    if (this.healthResults.gas?.status === "warning") {
      summary.push("High gas prices detected");
    }

    if (this.healthResults.responseTimes?.status === "warning") {
      summary.push("High response times detected");
    }

    return summary.join("; ");
  }

  async saveAlert(alert) {
    const alertsDir = path.join(__dirname, "alerts");
    if (!fs.existsSync(alertsDir)) {
      fs.mkdirSync(alertsDir, { recursive: true });
    }

    const alertFile = path.join(alertsDir, `alert-${Date.now()}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
  }
}

// Standalone health check function
async function runQuickHealthCheck(networkName = "localhost") {
  const checker = new HealthChecker(networkName);

  try {
    await checker.initialize();
    await checker.checkNetworkStatus();
    await checker.checkContractStatus();

    const status = checker.healthResults.report?.overallStatus || "unknown";
    console.log(`\n🏥 Health Status for ${networkName}: ${status.toUpperCase()}`);

    if (checker.healthResults.contracts?.summary) {
      const { healthy, total } = checker.healthResults.contracts.summary;
      console.log(`📋 Contracts: ${healthy}/${total} healthy`);
    }

    if (checker.healthResults.gas?.currentGasPriceGwei) {
      console.log(`⛽ Gas Price: ${parseFloat(checker.healthResults.gas.currentGasPriceGwei).toFixed(2)} gwei`);
    }

    return status;
  } catch (error) {
    console.error("❌ Quick health check failed:", error.message);
    return "error";
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const networkName = args[0] || process.env.NETWORK || "localhost";

  if (args.includes("--quick")) {
    runQuickHealthCheck(networkName)
      .then(status => process.exit(status === "error" ? 1 : 0))
      .catch(error => {
        console.error("❌ Health check failed:", error);
        process.exit(1);
      });
  } else {
    const checker = new HealthChecker(networkName);
    checker.runFullHealthCheck()
      .then(() => {
        const status = checker.healthResults.report?.overallStatus || "unknown";
        process.exit(status === "error" ? 1 : 0);
      })
      .catch(error => {
        console.error("❌ Health check failed:", error);
        process.exit(1);
      });
  }
}

module.exports = {
  HealthChecker,
  runQuickHealthCheck
};