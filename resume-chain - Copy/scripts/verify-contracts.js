const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Contract Verification Automation Script
 * Automatically verifies deployed contracts on block explorers
 */

class ContractVerifier {
  constructor(networkName = "localhost") {
    this.networkName = networkName;
    this.deployments = {};
    this.verificationResults = {};
  }

  async verifyAll() {
    console.log(`🔍 Starting contract verification for ${this.networkName} network`);

    try {
      await this.loadDeploymentInfo();
      await this.setupVerificationEnvironment();
      await this.verifyDeployedContracts();
      await this.saveVerificationResults();
      await this.printVerificationSummary();

      console.log("✅ Contract verification completed!");
      return this.verificationResults;
    } catch (error) {
      console.error("❌ Contract verification failed:", error.message);
      throw error;
    }
  }

  async loadDeploymentInfo() {
    console.log("📂 Loading deployment information...");

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const deploymentFile = path.join(deploymentsDir, `${this.networkName}-deployment.json`);

    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    this.deployments = deploymentData.contracts;

    console.log(`✅ Loaded deployment info for ${Object.keys(this.deployments).length} contracts`);
  }

  async setupVerificationEnvironment() {
    console.log("🔧 Setting up verification environment...");

    // Get network configuration
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    // Check for Etherscan API key
    if (this.networkName !== "localhost") {
      const apiKey = process.env.ETHERSCAN_API_KEY;
      if (!apiKey) {
        console.warn("⚠️  ETHERSCAN_API_KEY not found. Verification may fail.");
      } else {
        console.log("🔑 Etherscan API key found");
      }
    } else {
      console.log("⏭️  Skipping verification for localhost network");
      this.deployments = {}; // Skip verification on localhost
    }
  }

  async verifyDeployedContracts() {
    console.log(`📋 Verifying ${Object.keys(this.deployments).length} contracts...`);

    for (const [contractName, deployment] of Object.entries(this.deployments)) {
      console.log(`\n🔍 Verifying ${contractName}...`);
      await this.verifyContract(contractName, deployment);
    }
  }

  async verifyContract(contractName, deployment) {
    if (this.networkName === "localhost") {
      console.log(`   ⏭️  Skipping ${contractName} verification on localhost`);
      return;
    }

    try {
      // Get constructor arguments from deployment info
      const constructorArgs = await this.getConstructorArguments(contractName);

      console.log(`   📄 Contract: ${contractName}`);
      console.log(`   📍 Address: ${deployment.address}`);
      console.log(`   🔗 Transaction: ${deployment.transactionHash}`);
      console.log(`   🛠️  Constructor args: [${constructorArgs.join(", ")}]`);

      // Run verification
      await hre.run("verify:verify", {
        address: deployment.address,
        constructorArguments: constructorArgs,
        network: this.networkName
      });

      this.verificationResults[contractName] = {
        success: true,
        address: deployment.address,
        message: "Successfully verified",
        verifiedAt: new Date().toISOString()
      };

      console.log(`   ✅ ${contractName} verified successfully`);

    } catch (error) {
      let errorMessage = error.message;

      if (error.message.includes("Already Verified")) {
        this.verificationResults[contractName] = {
          success: true,
          address: deployment.address,
          message: "Already verified",
          verifiedAt: new Date().toISOString()
        };
        console.log(`   ✅ ${contractName} already verified`);
      } else if (error.message.includes("Missing constructor arguments")) {
        this.verificationResults[contractName] = {
          success: false,
          address: deployment.address,
          message: "Missing constructor arguments",
          error: errorMessage,
          verifiedAt: new Date().toISOString()
        };
        console.log(`   ❌ ${contractName} verification failed: Missing constructor arguments`);
      } else if (error.message.includes("Contract source code not verified")) {
        this.verificationResults[contractName] = {
          success: false,
          address: deployment.address,
          message: "Contract source code not verified",
          error: errorMessage,
          verifiedAt: new Date().toISOString()
        };
        console.log(`   ❌ ${contractName} verification failed: Source code issue`);
      } else {
        this.verificationResults[contractName] = {
          success: false,
          address: deployment.address,
          message: "Verification failed",
          error: errorMessage,
          verifiedAt: new Date().toISOString()
        };
        console.log(`   ❌ ${contractName} verification failed: ${errorMessage}`);
      }
    }
  }

  async getConstructorArguments(contractName) {
    // Map contract names to their constructor arguments
    const constructorArgsMap = {
      "UniversityRegistry": [],
      "ResumeRegistry": [this.deployments["UniversityRegistry"].address],
      "SkillRegistry": [this.deployments["UniversityRegistry"].address],
      "EndorsementRegistry": [this.deployments["ResumeRegistry"].address],
      "EmployeeRegistry": [this.deployments["ResumeRegistry"].address]
    };

    return constructorArgsMap[contractName] || [];
  }

  async saveVerificationResults() {
    console.log("\n💾 Saving verification results...");

    const verificationInfo = {
      network: this.networkName,
      verifiedAt: new Date().toISOString(),
      contracts: this.verificationResults,
      summary: this.generateSummary()
    };

    // Create verifications directory if it doesn't exist
    const verificationsDir = path.join(__dirname, "..", "verifications");
    if (!fs.existsSync(verificationsDir)) {
      fs.mkdirSync(verificationsDir, { recursive: true });
    }

    // Save verification results
    const verificationFile = path.join(verificationsDir, `${this.networkName}-verification.json`);
    fs.writeFileSync(verificationFile, JSON.stringify(verificationInfo, null, 2));

    console.log(`   Verification results saved to: ${verificationFile}`);
  }

  generateSummary() {
    const total = Object.keys(this.verificationResults).length;
    const successful = Object.values(this.verificationResults).filter(r => r.success).length;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + "%" : "0%"
    };
  }

  async printVerificationSummary() {
    console.log("\n📋 Verification Summary");
    console.log("======================");
    console.log(`Network: ${this.networkName}`);
    console.log(`Verification time: ${new Date().toISOString()}`);

    const summary = this.generateSummary();
    console.log(`\nResults: ${summary.successful}/${summary.total} contracts verified (${summary.successRate})`);

    console.log("\nContract Details:");
    for (const [name, result] of Object.entries(this.verificationResults)) {
      const status = result.success ? "✅" : "❌";
      console.log(`  ${status} ${name}: ${result.message}`);
      if (!result.success && result.error) {
        console.log(`     Error: ${result.error.substring(0, 100)}...`);
      }
    }

    if (summary.failed > 0) {
      console.log("\n⚠️  Some contracts failed verification. Check the error messages above.");
      console.log("💡 Common issues:");
      console.log("   - Missing ETHERSCAN_API_KEY environment variable");
      console.log("   - Incorrect constructor arguments");
      console.log("   - Contract source code not matching deployed bytecode");
      console.log("   - Network synchronization issues");
    }
  }

  async retryFailed(maxRetries = 3) {
    console.log(`🔄 Retrying failed verifications (max ${maxRetries} attempts)...`);

    const failedContracts = Object.entries(this.verificationResults)
      .filter(([_, result]) => !result.success)
      .map(([name, _]) => name);

    if (failedContracts.length === 0) {
      console.log("✅ No failed contracts to retry");
      return;
    }

    console.log(`🔄 Retrying ${failedContracts.length} contracts: ${failedContracts.join(", ")}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔄 Retry attempt ${attempt}/${maxRetries}`);

      let retrySuccess = false;
      for (const contractName of failedContracts) {
        if (this.verificationResults[contractName].success) {
          continue; // Skip if already verified
        }

        console.log(`\n🔄 Retrying ${contractName}...`);
        const deployment = this.deployments[contractName];

        try {
          // Wait before retry
          if (attempt > 1) {
            await this.sleep(5000 * attempt); // Increasing delay
          }

          await this.verifyContract(contractName, deployment);
          retrySuccess = true;

        } catch (error) {
          console.log(`   ❌ Retry failed: ${error.message}`);
        }
      }

      if (retrySuccess) {
        await this.saveVerificationResults();
      }
    }

    await this.printVerificationSummary();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Helper function to verify specific contracts
async function verifySpecificContracts(contractNames, networkName = "localhost") {
  const verifier = new ContractVerifier(networkName);
  await verifier.loadDeploymentInfo();
  await verifier.setupVerificationEnvironment();

  console.log(`🔍 Verifying specific contracts: ${contractNames.join(", ")}`);

  for (const contractName of contractNames) {
    if (!verifier.deployments[contractName]) {
      console.log(`❌ Contract ${contractName} not found in deployment info`);
      continue;
    }

    console.log(`\n🔍 Verifying ${contractName}...`);
    await verifier.verifyContract(contractName, verifier.deployments[contractName]);
  }

  await verifier.saveVerificationResults();
  await verifier.printVerificationSummary();
}

// Helper function to check verification status
async function checkVerificationStatus(contractAddress, networkName = "localhost") {
  console.log(`🔍 Checking verification status for ${contractAddress} on ${networkName}`);

  try {
    // This would typically use Etherscan API to check status
    // For now, we'll implement a basic check
    const network = await ethers.provider.getNetwork();

    if (networkName === "localhost") {
      console.log("ℹ️  Verification status cannot be checked on localhost");
      return { verified: false, reason: "localhost" };
    }

    // Placeholder for actual API call
    console.log(`📡 Checking verification status on ${network.name}...`);

    return { verified: false, reason: "API not implemented" };

  } catch (error) {
    console.error("❌ Failed to check verification status:", error.message);
    return { verified: false, error: error.message };
  }
}

// Main execution function
async function main() {
  const networkName = process.env.NETWORK || "localhost";
  const retryFailed = process.env.RETRY_FAILED === "true";
  const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;

  console.log(`🚀 Starting contract verification for ${networkName} network`);

  const verifier = new ContractVerifier(networkName);
  await verifier.verifyAll();

  if (retryFailed) {
    await verifier.retryFailed(maxRetries);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Contract Verification Tool

Usage: node verify-contracts.js [options]

Options:
  --help, -h                 Show this help message
  --network <name>           Specify network (localhost, sepolia, mainnet, polygon)
  --retry                    Retry failed verifications
  --max-retries <number>     Maximum retry attempts (default: 3)
  --contracts <names>        Verify specific contracts (comma-separated)

Environment Variables:
  NETWORK                    Network name (default: localhost)
  ETHERSCAN_API_KEY          Etherscan API key for verification
  RETRY_FAILED               Set to "true" to retry failed verifications
  MAX_RETRIES                Maximum number of retry attempts

Examples:
  node verify-contracts.js --network sepolia
  node verify-contracts.js --network mainnet --retry --max-retries 5
  node verify-contracts.js --contracts UniversityRegistry,ResumeRegistry
`);
    process.exit(0);
  }

  // Parse command line arguments
  const networkIndex = args.indexOf("--network");
  const contractsIndex = args.indexOf("--contracts");

  if (networkIndex !== -1) {
    process.env.NETWORK = args[networkIndex + 1];
  }

  if (contractsIndex !== -1) {
    const contractNames = args[contractsIndex + 1].split(",");
    verifySpecificContracts(contractNames, process.env.NETWORK || "localhost")
      .then(() => process.exit(0))
      .catch(error => {
        console.error("❌ Contract verification failed:", error);
        process.exit(1);
      });
  } else {
    main()
      .then(() => process.exit(0))
      .catch(error => {
        console.error("❌ Contract verification failed:", error);
        process.exit(1);
      });
  }
}

module.exports = {
  ContractVerifier,
  verifySpecificContracts,
  checkVerificationStatus
};