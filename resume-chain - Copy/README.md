# Blockchain-Based Resume Verification System

A decentralized web application built on Ethereum with IPFS integration that ensures authenticity and transparency in academic and professional credentials.

## 🌟 Features

- **Secure Student Registration**: Students can register, upload, and store resume data on IPFS
- **University Verification**: Universities validate and endorse student credentials using smart contracts
- **Employer Access**: Employers can verify resumes, search for candidates, and endorse skills
- **Blockchain-Based Verification**: Cryptographic hashing ensures data integrity
- **Decentralized Storage**: IPFS integration for tamper-proof document storage
- **Skill Testing & Endorsement**: Comprehensive skill validation and trust scoring system

## 🏗️ Architecture

### Smart Contracts
- **ResumeRegistry.sol**: Core student resume management and verification
- **UniversityRegistry.sol**: University registration and student record management
- **SkillRegistry.sol**: Skill testing and certification system
- **EndorsementRegistry.sol**: Skill endorsement and trust scoring
- **EmployeeRegistry.sol**: Employer registration and job notifications

### Technology Stack
- **Blockchain**: Ethereum Smart Contracts (Solidity 0.8.28)
- **Development**: Hardhat Framework
- **Storage**: IPFS with Lighthouse API
- **Frontend**: HTML/CSS/JavaScript with Web3.js
- **Testing**: Comprehensive test suite with Chai and Hardhat

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask browser extension

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd resume-chain
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start local blockchain**
```bash
npx hardhat node
```

5. **Deploy contracts (new terminal)**
```bash
npm run deploy:local
```

6. **Start frontend**
```bash
npm start
```

7. **Access the application**
   - Open http://localhost:3000 in your browser
   - Connect MetaMask to localhost (Chain ID: 31337)

## 📖 Documentation

### User Guides
- [Student Guide](docs/guides/student-guide.md) - How to register and verify your resume
- [University Guide](docs/guides/university-guide.md) - How to verify student credentials
- [Employer Guide](docs/guides/employer-guide.md) - How to search and verify candidates

### Development
- [API Documentation](docs/api/README.md) - Complete API reference
- [Deployment Guide](docs/deployment/README.md) - Deploy to different networks
- [Testing Guide](docs/guides/testing-guide.md) - Run and write tests
- [Security Guide](docs/guides/security-guide.md) - Security best practices

### Troubleshooting
- [Common Issues](docs/troubleshooting/common-issues.md) - Solutions to frequent problems
- [FAQ](docs/troubleshooting/faq.md) - Frequently asked questions

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit      # Unit tests
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests
npm run test:security  # Security tests
npm run test:performance # Performance tests

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run test coverage
npm run test:coverage
```

### Test Coverage
- ✅ **Unit Tests**: Individual contract functionality
- ✅ **Integration Tests**: Cross-contract communication
- ✅ **End-to-End Tests**: Complete user workflows
- ✅ **Security Tests**: Attack vector coverage
- ✅ **Performance Tests**: Gas optimization and load testing
- ✅ **Frontend Tests**: Web3.js integration testing

## 🚀 Deployment

### Local Development
```bash
npm run deploy:local
```

### Testnet (Sepolia)
```bash
# Set environment variables
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
export PRIVATE_KEY="your_private_key"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# Deploy and verify
npm run deploy:sepolia
npm run verify:contracts
```

### Multi-Network Deployment
```bash
# Deploy to specific network
NETWORK=sepolia node scripts/deploy-multi-network.js

# Deploy to mainnet (caution!)
NETWORK=mainnet node scripts/deploy-multi-network.js
```

## 🔧 Configuration

### Environment Variables
```bash
# Network Configuration
NETWORK=localhost                    # Target network
SEPOLIA_RPC_URL=...                  # Sepolia RPC URL
MAINNET_RPC_URL=...                  # Mainnet RPC URL
POLYGON_RPC_URL=...                  # Polygon RPC URL

# Deployment
PRIVATE_KEY=...                      # Deployer private key
ETHERSCAN_API_KEY=...                # Etherscan API key

# IPFS Configuration
LIGHTHOUSE_API_KEY=...               # Lighthouse API key
IPFS_GATEWAY=...                     # Custom IPFS gateway

# Monitoring
WEBHOOK_URL=...                      # Alert webhook URL
SLACK_WEBHOOK=...                    # Slack notifications
```

## 🔍 Monitoring & Health Checks

### System Health Monitoring
```bash
# Run full health check
npm run monitor

# Quick health check
node scripts/monitoring/health-check.js --quick

# Health check for specific network
NETWORK=sepolia npm run monitor
```

### Health Check Features
- **Network Status**: Blockchain connectivity and block time monitoring
- **Contract Health**: Smart contract availability and response times
- **IPFS Connectivity**: IPFS gateway status and performance
- **Gas Price Monitoring**: Current gas prices and alerts
- **System Resources**: Memory usage and performance metrics

## 🔒 Security

### Security Features
- **Access Control**: Role-based permissions for all operations
- **Input Validation**: Comprehensive input sanitization
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Overflow Protection**: Safe mathematical operations
- **Rate Limiting**: Gas limit protections against DoS attacks

### Security Audits
- **Static Analysis**: Slither integration for vulnerability detection
- **Security Testing**: Comprehensive attack vector testing
- **Best Practices**: OpenZeppelin security patterns

## 📊 Performance Metrics

### Gas Usage (Approximate)
- Student Registration: ~150,000 gas
- Student Verification: ~80,000 gas
- Skill Endorsement: ~120,000 gas
- Job Notification: ~100,000 gas

### Performance Benchmarks
- **Response Times**: <2 seconds for most operations
- **Concurrent Users**: Tested up to 50 simultaneous users
- **Data Storage**: Handles 1000+ student records efficiently

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

### Getting Help
- 📖 Check the [Documentation](docs/)
- 🔍 Search existing issues
- 📧 Email: support@resume-chain.com

### Reporting Issues
If you encounter any issues, please:
1. Check existing issues
2. Create a detailed bug report
3. Include error messages and steps to reproduce
4. Provide system information

## 🗺️ Roadmap

### Phase 1: Core Testing (Completed ✅)
- [x] Comprehensive test suite
- [x] CI/CD pipeline
- [x] Multi-network deployment
- [x] Security audit framework

### Phase 2: Enhanced Features (In Progress 🚧)
- [ ] Advanced skill testing algorithms
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Integration with LinkedIn and other platforms

### Phase 3: Production Launch (Planned 📋)
- [ ] Mainnet deployment
- [ ] External security audit
- [ ] Performance optimization
- [ ] User onboarding program

### Phase 4: Ecosystem Expansion (Future 🚀)
- [ ] Multi-chain support
- [ ] DAO governance
- [ ] Tokenomics implementation
- [ ] Enterprise features

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Hardhat](https://hardhat.org/) for development framework
- [IPFS](https://ipfs.io/) for decentralized storage
- [Ethers.js](https://docs.ethers.org/) for blockchain interaction

---

Built with ❤️ for the future of credential verification
