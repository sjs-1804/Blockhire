# Deployment Guide

Complete guide for deploying the Blockchain-Based Resume Verification System to different networks.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Testnet Deployment](#testnet-deployment)
- [Mainnet Deployment](#mainnet-deployment)
- [Multi-Network Deployment](#multi-network-deployment)
- [Contract Verification](#contract-verification)
- [Post-Deployment Setup](#post-deployment-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v18 or higher
- **npm** or **yarn**
- **Git**
- **MetaMask** browser extension

### Required Accounts
- **Ethereum wallet** with private key
- **Testnet ETH** for testnet deployment
- **Mainnet ETH** for mainnet deployment
- **API Keys**:
  - Infura/Alchemy RPC URL
  - Etherscan API key (for verification)

### Security Requirements
- Secure private key storage
- Hardware wallet recommended for mainnet
- 2FA enabled on all accounts

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd resume-chain
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file with your configuration:

```bash
# Network Configuration
NETWORK=localhost
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com

# Deployment Keys
PRIVATE_KEY=your_private_key_here
MNEMONIC=your_mnemonic_here (optional)

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# IPFS Configuration
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Frontend Configuration
REACT_APP_NETWORK_ID=31337
REACT_APP_CONTRACT_ADDRESS=0x...
```

### 4. Security Setup
```bash
# Set proper file permissions
chmod 600 .env

# Add .env to .gitignore
echo ".env" >> .gitignore
```

---

## Local Development

### 1. Start Local Blockchain
```bash
npx hardhat node
```

This starts a local Hardhat network with:
- Chain ID: 31337
- 20 test accounts with 1000 ETH each
- Local JSON-RPC server on http://127.0.0.1:8545

### 2. Deploy Contracts
In a new terminal:
```bash
npm run deploy:local
```

### 3. Configure MetaMask
1. Open MetaMask
2. Click "Add Network"
3. Enter these details:
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

4. Import test account:
   - Use one of the private keys shown when starting Hardhat node
   - Private key example: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 4. Start Frontend
```bash
npm start
```

Visit http://localhost:3000 to access the application.

---

## Testnet Deployment

### 1. Get Testnet ETH
#### Sepolia Testnet
- **Faucet**: https://sepoliafaucet.com/
- **Alternative**: https://www.alchemy.com/faucets/ethereum-sepolia
- **Required**: 0.1-0.5 ETH for deployment

### 2. Configure Testnet
Add to your `.env`:
```bash
NETWORK=sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

### 4. Verify Contracts
```bash
npm run verify:contracts
```

### 5. Update Frontend Configuration
```bash
# For React frontend
REACT_APP_NETWORK_ID=11155111
REACT_APP_CONTRACT_ADDRESS=0x... # From deployment output
```

### 6. Configure MetaMask for Sepolia
- **Network Name**: Sepolia Testnet
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **Chain ID**: 11155111
- **Currency Symbol**: ETH

---

## Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment involves real ETH costs. Test thoroughly on testnets first.

### 1. Pre-Deployment Checklist
- [ ] All tests pass locally
- [ ] Testnet deployment successful
- [ ] Security audit completed
- [ ] Sufficient ETH for deployment (1-2 ETH recommended)
- [ ] Hardware wallet ready
- [ ] Backup of all important data

### 2. Mainnet Preparation
```bash
# Update .env for mainnet
NETWORK=mainnet
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key

# Use hardware wallet or secure method for PRIVATE_KEY
PRIVATE_KEY=your_mainnet_private_key
```

### 3. Estimate Gas Costs
```bash
# Dry run to estimate gas usage
npx hardhat run scripts/deploy-multi-network.js --network mainnet --dry-run
```

### 4. Deploy to Mainnet
```bash
NETWORK=mainnet node scripts/deploy-multi-network.js
```

### 5. Verify Mainnet Contracts
```bash
NETWORK=mainnet npm run verify:contracts
```

### 6. Update Production Configuration
```bash
REACT_APP_NETWORK_ID=1
REACT_APP_CONTRACT_ADDRESS=0x... # Mainnet contract address
```

---

## Multi-Network Deployment

### 1. Multi-Network Script
The `deploy-multi-network.js` script supports deployment to multiple networks:

```bash
# Deploy to specific network
NETWORK=sepolia node scripts/deploy-multi-network.js

# Deploy to multiple networks sequentially
for network in sepolia polygon mainnet; do
    NETWORK=$network node scripts/deploy-multi-network.js
    sleep 60 # Wait between deployments
done
```

### 2. Network Configurations
Supported networks:
- **localhost**: Local development
- **sepolia**: Ethereum testnet
- **mainnet**: Ethereum mainnet
- **polygon**: Polygon mainnet

### 3. Cross-Network Considerations
- Gas prices vary significantly
- Transaction speeds differ
- Block confirmation requirements
- Network-specific RPC endpoints

---

## Contract Verification

### 1. Automatic Verification
Contracts are automatically verified during deployment if:
- `ETHERSCAN_API_KEY` is set
- Network supports block explorer verification
- Constructor arguments are correctly specified

### 2. Manual Verification
If automatic verification fails:

```bash
# Verify specific contract
npx hardhat verify --network sepolia <contract-address> <constructor-args>

# Example
npx hardhat verify --network sepolia 0x123456... "0xabcd..." "constructor-arg"
```

### 3. Verification Script
```bash
# Verify all deployed contracts
npm run verify:contracts

# Verify with retries
RETRY_FAILED=true node scripts/verify-contracts.js

# Verify specific contracts
node scripts/verify-contracts.js --contracts UniversityRegistry,ResumeRegistry
```

---

## Post-Deployment Setup

### 1. Save Deployment Information
After deployment, save this information:
- Contract addresses
- Deployment transaction hashes
- Block numbers
- Deployment timestamps
- Network configurations

### 2. Initialize System
Deploy contracts require initialization:

```javascript
// Example initialization script
async function initializeSystem() {
    const [owner] = await ethers.getSigners();

    // Add first university
    const universityRegistry = await ethers.getContractAt("UniversityRegistry", UNIVERSITY_ADDRESS);
    await universityRegistry.addUniversity(UNIVERSITY_WALLET_ADDRESS);

    console.log("System initialized successfully");
}
```

### 3. Health Check
Run health checks to verify deployment:

```bash
# Quick health check
node scripts/monitoring/health-check.js --quick

# Full health check
NETWORK=sepolia npm run monitor
```

### 4. Frontend Deployment
Deploy frontend to hosting service:

```bash
# Build for production
npm run build

# Deploy to your hosting service
# Example for Vercel
vercel --prod

# Example for Netlify
netlify deploy --prod --dir=build
```

---

## Advanced Deployment Options

### 1. Using Deploy Scripts
Create custom deployment scripts:

```javascript
// scripts/custom-deploy.js
const { ethers } = require("hardhat");

async function customDeploy() {
    // Custom deployment logic
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Deployment steps
    // ...
}

customDeploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
```

### 2. Deployment with Upgradeable Contracts
For production use with OpenZeppelin upgrades:

```bash
# Install upgradeable contracts
npm install @openzeppelin/hardhat-upgrades

# Deploy upgradeable contracts
npx hardhat run scripts/deploy-upgradeable.js
```

### 3. Multi-Sig Deployment
For enhanced security:

```bash
# Use Gnosis Safe for deployment
# Deploy to multi-sig wallet
# Require multiple signatures for critical operations
```

---

## Monitoring and Maintenance

### 1. Set Up Monitoring
```bash
# Continuous monitoring
npm run monitor

# Health checks every 5 minutes
*/5 * * * * cd /path/to/project && npm run monitor
```

### 2. Gas Price Monitoring
Monitor gas prices for optimal deployment times:

```javascript
// Gas price monitoring script
async function monitorGasPrice() {
    const gasPrice = await provider.getFeeData();
    console.log("Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
}
```

### 3. Security Monitoring
- Monitor for unusual contract interactions
- Set up alerts for large transactions
- Track contract state changes

---

## Troubleshooting

### Common Issues

#### 1. Insufficient Gas
```
Error: insufficient funds for gas
```
**Solution**: Add more ETH to deployer wallet

#### 2. RPC Connection Issues
```
Error: network connection timeout
```
**Solution**:
- Check RPC URL
- Try different RPC provider
- Increase timeout

#### 3. Contract Verification Failed
```
Error: Contract source code not verified
```
**Solution**:
- Check constructor arguments
- Verify network matches
- Wait for block confirmations

#### 4. Frontend Connection Issues
```
Error: Contract not deployed on network
```
**Solution**:
- Verify contract address
- Check MetaMask network
- Confirm network ID

### Debug Commands

```bash
# Check network connection
npx hardhat run scripts/check-network.js

# Test contract deployment locally
npx hardhat test

# Check gas prices
npx hardhat run scripts/check-gas.js

# Verify deployment
npx hardhat run scripts/verify-deployment.js
```

### Getting Help

1. **Check logs**: Review deployment logs for errors
2. **Verify configuration**: Ensure all environment variables are correct
3. **Test locally**: Reproduce issue on local network
4. **Consult documentation**: Review API documentation
5. **Community support**: Join Discord or GitHub discussions

---

## Security Best Practices

### 1. Private Key Management
- Use hardware wallets for mainnet
- Never commit private keys to version control
- Use environment variables or secure key management
- Rotate keys regularly

### 2. Deployment Security
- Use multi-sig wallets for production
- Implement time locks for critical functions
- Regular security audits
- Monitor contract activity

### 3. Access Control
- Implement role-based access control
- Use OpenZeppelin's access control patterns
- Regular access reviews
- Principle of least privilege

### 4. Monitoring and Alerts
- Set up monitoring for all contract interactions
- Alert on unusual activity
- Regular security scans
- Performance monitoring

---

For additional support or questions, refer to the [Troubleshooting Guide](../troubleshooting/common-issues.md) or create an issue in the repository.