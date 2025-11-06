const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Multi-Network Deployment Script
 * Deploys contracts to multiple networks with proper configuration
 */

const NETWORK_CONFIG = {
  localhost: {
    name: "localhost",
    chainId: 31337,
    url: "http://127.0.0.1:8545",
    gasPrice: 20000000000, // 20 gwei
    confirmations: 1,
    skipVerification: true
  },
  sepolia: {
    name: "sepolia",
    chainId: 11155111,
    url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
    gasPrice: 20000000000, // 20 gwei
    confirmations: 6,
    skipVerification: false,
    etherscanAPI: process.env.ETHERSCAN_API_KEY
  },
  mainnet: {
    name: "mainnet",
    chainId: 1,
    url: process.env.MAINNET_RPC_URL || "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    gasPrice: 30000000000, // 30 gwei
    confirmations: 12,
    skipVerification: false,
    etherscanAPI: process.env.ETHERSCAN_API_KEY
  },
  polygon: {
    name: "polygon",
    chainId: 137,
    url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    gasPrice: 30000000000, // 30 gwei
    confirmations: 5,
    skipVerification: false,
    etherscanAPI: process.env.POLYGONSCAN_API_KEY
  }
};

class MultiNetworkDeployer {
  constructor(networkName = "localhost") {
    this.networkName = networkName;
    this.config = NETWORK_CONFIG[networkName];
    this.deployments = {};
    this.gasUsed = {};

    if (!this.config) {
      throw new Error(`Network ${networkName} not configured`);
    }
  }

  async deploy() {
    console.log(`🚀 Starting deployment to ${this.config.name} network`);
    console.log(`📊 Network Configuration:`);
    console.log(`   Chain ID: ${this.config.chainId}`);
    console.log(`   RPC URL: ${this.config.url}`);
    console.log(`   Gas Price: ${ethers.formatUnits(this.config.gasPrice, "gwei")} gwei`);
    console.log(`   Confirmations: ${this.config.confirmations}`);

    try {
      await this.setupProvider();
      await this.deployContracts();
      await this.verifyContracts();
      await this.saveDeploymentInfo();
      await this.printDeploymentSummary();

      console.log(`✅ Deployment to ${this.config.name} completed successfully!`);
      return this.deployments;
    } catch (error) {
      console.error(`❌ Deployment to ${this.config.name} failed:`, error.message);
      throw error;
    }
  }

  async setupProvider() {
    console.log("🔧 Setting up provider and signer...");

    // Setup provider
    if (this.networkName === "localhost") {
      // Use Hardhat provider for localhost
      this.provider = ethers.provider;
      [this.signer] = await ethers.getSigners();
    } else {
      // Use custom provider for external networks
      this.provider = new ethers.JsonRpcProvider(this.config.url);

      if (!process.env.PRIVATE_KEY) {
        throw new Error(`PRIVATE_KEY environment variable required for ${this.networkName} deployment`);
      }

      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    }

    console.log(`👛 Deployer address: ${await this.signer.getAddress()}`);

    // Check balance
    const balance = await this.provider.getBalance(await this.signer.getAddress());
    console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n && this.networkName !== "localhost") {
      throw new Error("Insufficient balance for deployment");
    }
  }

  async deployContracts() {
    console.log("📦 Deploying contracts...");

    // Deploy contracts in dependency order
    const deploymentSteps = [
      { name: "UniversityRegistry", deploy: () => this.deployUniversityRegistry() },
      { name: "ResumeRegistry", deploy: () => this.deployResumeRegistry() },
      { name: "SkillRegistry", deploy: () => this.deploySkillRegistry() },
      { name: "EndorsementRegistry", deploy: () => this.deployEndorsementRegistry() },
      { name: "EmployeeRegistry", deploy: () => this.deployEmployeeRegistry() }
    ];

    for (const step of deploymentSteps) {
      console.log(`\n📄 Deploying ${step.name}...`);
      const deployment = await step.deploy();
      this.deployments[step.name] = deployment;
    }
  }

  async deployUniversityRegistry() {
    const UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");

    const tx = await UniversityRegistry.connect(this.signer).deploy({
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice
    });

    console.log(`   Transaction hash: ${tx.deploymentTransaction().hash}`);
    console.log("   Waiting for deployment confirmation...");

    const contract = await tx.waitForDeployment();
    const address = await contract.getAddress();

    // Wait for confirmations
    await this.waitForConfirmations(tx.deploymentTransaction().hash);

    const gasUsed = await this.getGasUsed(tx.deploymentTransaction().hash);
    this.gasUsed["UniversityRegistry"] = gasUsed;

    console.log(`   ✅ UniversityRegistry deployed at: ${address}`);
    console.log(`   ⛽ Gas used: ${gasUsed}`);

    return {
      address,
      transactionHash: tx.deploymentTransaction().hash,
      gasUsed,
      contract
    };
  }

  async deployResumeRegistry() {
    const ResumeRegistry = await ethers.getContractFactory("ResumeRegistry");
    const universityAddress = this.deployments["UniversityRegistry"].address;

    const tx = await ResumeRegistry.connect(this.signer).deploy(universityAddress, {
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice
    });

    console.log(`   Transaction hash: ${tx.deploymentTransaction().hash}`);
    console.log("   Waiting for deployment confirmation...");

    const contract = await tx.waitForDeployment();
    const address = await contract.getAddress();

    await this.waitForConfirmations(tx.deploymentTransaction().hash);

    const gasUsed = await this.getGasUsed(tx.deploymentTransaction().hash);
    this.gasUsed["ResumeRegistry"] = gasUsed;

    console.log(`   ✅ ResumeRegistry deployed at: ${address}`);
    console.log(`   ⛽ Gas used: ${gasUsed}`);

    return {
      address,
      transactionHash: tx.deploymentTransaction().hash,
      gasUsed,
      contract,
      constructorArgs: [universityAddress]
    };
  }

  async deploySkillRegistry() {
    const SkillRegistry = await ethers.getContractFactory("SkillRegistry");
    const universityAddress = this.deployments["UniversityRegistry"].address;

    const tx = await SkillRegistry.connect(this.signer).deploy(universityAddress, {
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice
    });

    console.log(`   Transaction hash: ${tx.deploymentTransaction().hash}`);
    console.log("   Waiting for deployment confirmation...");

    const contract = await tx.waitForDeployment();
    const address = await contract.getAddress();

    await this.waitForConfirmations(tx.deploymentTransaction().hash);

    const gasUsed = await this.getGasUsed(tx.deploymentTransaction().hash);
    this.gasUsed["SkillRegistry"] = gasUsed;

    console.log(`   ✅ SkillRegistry deployed at: ${address}`);
    console.log(`   ⛽ Gas used: ${gasUsed}`);

    return {
      address,
      transactionHash: tx.deploymentTransaction().hash,
      gasUsed,
      contract,
      constructorArgs: [universityAddress]
    };
  }

  async deployEndorsementRegistry() {
    const EndorsementRegistry = await ethers.getContractFactory("EndorsementRegistry");
    const resumeAddress = this.deployments["ResumeRegistry"].address;

    const tx = await EndorsementRegistry.connect(this.signer).deploy(resumeAddress, {
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice
    });

    console.log(`   Transaction hash: ${tx.deploymentTransaction().hash}`);
    console.log("   Waiting for deployment confirmation...");

    const contract = await tx.waitForDeployment();
    const address = await contract.getAddress();

    await this.waitForConfirmations(tx.deploymentTransaction().hash);

    const gasUsed = await this.getGasUsed(tx.deploymentTransaction().hash);
    this.gasUsed["EndorsementRegistry"] = gasUsed;

    console.log(`   ✅ EndorsementRegistry deployed at: ${address}`);
    console.log(`   ⛽ Gas used: ${gasUsed}`);

    return {
      address,
      transactionHash: tx.deploymentTransaction().hash,
      gasUsed,
      contract,
      constructorArgs: [resumeAddress]
    };
  }

  async deployEmployeeRegistry() {
    const EmployeeRegistry = await ethers.getContractFactory("employeeRegistry");
    const resumeAddress = this.deployments["ResumeRegistry"].address;

    const tx = await EmployeeRegistry.connect(this.signer).deploy(resumeAddress, {
      gasLimit: 3000000,
      gasPrice: this.config.gasPrice
    });

    console.log(`   Transaction hash: ${tx.deploymentTransaction().hash}`);
    console.log("   Waiting for deployment confirmation...");

    const contract = await tx.waitForDeployment();
    const address = await contract.getAddress();

    await this.waitForConfirmations(tx.deploymentTransaction().hash);

    const gasUsed = await this.getGasUsed(tx.deploymentTransaction().hash);
    this.gasUsed["EmployeeRegistry"] = gasUsed;

    console.log(`   ✅ EmployeeRegistry deployed at: ${address}`);
    console.log(`   ⛽ Gas used: ${gasUsed}`);

    return {
      address,
      transactionHash: tx.deploymentTransaction().hash,
      gasUsed,
      contract,
      constructorArgs: [resumeAddress]
    };
  }

  async verifyContracts() {
    if (this.config.skipVerification) {
      console.log("⏭️  Skipping contract verification");
      return;
    }

    console.log("\n🔍 Verifying contracts on block explorer...");

    if (!this.config.etherscanAPI) {
      console.log("⚠️  Etherscan API key not provided, skipping verification");
      return;
    }

    for (const [contractName, deployment] of Object.entries(this.deployments)) {
      try {
        console.log(`   Verifying ${contractName}...`);

        await hre.run("verify:verify", {
          address: deployment.address,
          constructorArguments: deployment.constructorArgs || [],
          network: this.networkName
        });

        console.log(`   ✅ ${contractName} verified successfully`);
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`   ✅ ${contractName} already verified`);
        } else {
          console.log(`   ❌ Failed to verify ${contractName}: ${error.message}`);
        }
      }
    }
  }

  async waitForConfirmations(txHash) {
    console.log(`   Waiting for ${this.config.confirmations} confirmations...`);

    for (let i = 0; i < this.config.confirmations; i++) {
      await this.provider.waitForTransaction(txHash, 1, 60000); // 60 second timeout
      console.log(`   Confirmation ${i + 1}/${this.config.confirmations} received`);
    }
  }

  async getGasUsed(txHash) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return receipt.gasUsed;
  }

  async saveDeploymentInfo() {
    console.log("\n💾 Saving deployment information...");

    const deploymentInfo = {
      network: this.config.name,
      chainId: this.config.chainId,
      deployer: await this.signer.getAddress(),
      deployedAt: new Date().toISOString(),
      contracts: {},
      totalGasUsed: 0
    };

    let totalGas = 0n;
    for (const [name, deployment] of Object.entries(this.deployments)) {
      deploymentInfo.contracts[name] = {
        address: deployment.address,
        transactionHash: deployment.transactionHash,
        gasUsed: deployment.gasUsed.toString()
      };
      totalGas += deployment.gasUsed;
    }

    deploymentInfo.totalGasUsed = totalGas.toString();

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, `${this.networkName}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Save addresses file for easy access
    const addressesFile = path.join(deploymentsDir, `${this.networkName}.json`);
    const addresses = {};
    for (const [name, deployment] of Object.entries(this.deployments)) {
      addresses[name] = deployment.address;
    }
    fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));

    console.log(`   Deployment info saved to: ${deploymentFile}`);
    console.log(`   Addresses saved to: ${addressesFile}`);
  }

  async printDeploymentSummary() {
    console.log("\n📋 Deployment Summary");
    console.log("==================");
    console.log(`Network: ${this.config.name} (Chain ID: ${this.config.chainId})`);
    console.log(`Deployer: ${await this.signer.getAddress()}`);
    console.log(`Deployment time: ${new Date().toISOString()}`);
    console.log("");

    console.log("Contract Addresses:");
    for (const [name, deployment] of Object.entries(this.deployments)) {
      console.log(`  ${name}: ${deployment.address}`);
      console.log(`    └─ Transaction: ${deployment.transactionHash}`);
      console.log(`    └─ Gas Used: ${deployment.gasUsed}`);
    }

    const totalGas = Object.values(this.gasUsed).reduce((sum, gas) => sum + gas, 0n);
    console.log(`\nTotal Gas Used: ${totalGas}`);
    console.log(`Total Gas Cost: ${ethers.formatEther(totalGas * BigInt(this.config.gasPrice))} ETH`);

    if (!this.config.skipVerification) {
      console.log("\nVerification Status:");
      for (const name of Object.keys(this.deployments)) {
        console.log(`  ${name}: Verified ✅`);
      }
    }
  }
}

// Main deployment function
async function main() {
  const networkName = process.env.NETWORK || "localhost";
  const deployer = new MultiNetworkDeployer(networkName);

  await deployer.deploy();
}

// Error handling
process.on("unhandledRejection", (error, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Export for use in other scripts
module.exports = { MultiNetworkDeployer, NETWORK_CONFIG };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}