# ⏳ Time-Locked Savings dApp

[![CI/CD Pipeline](https://github.com/ranitpal77/TimeLockedSavings/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/ranitpal77/TimeLockedSavings/actions/workflows/ci-cd.yml)

![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)
![Stellar](https://img.shields.io/badge/stellar-%23EF3B49.svg?style=for-the-badge&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/soroban-%232D79C7.svg?style=for-the-badge)

## 📖 Project Description
The **Time-Locked Savings dApp** is a decentralized application built on the Stellar network utilizing Soroban Smart Contracts. It promotes disciplined saving mechanisms or delayed gratification by allowing users to securely lock up their Stellar assets (e.g., XLM, USDC, DAO tokens) for a predefined period. Once the funds are locked, they are cryptographically secured and strictly immobilized. The funds cannot be retrieved under any circumstances until the designated maturity timeline (ledger timestamp) has been reached.

## 🚀 What it does
1. **Connect Wallet:** Seamlessly pairs with the Freighter extension.
2. **Deposit & Lock:** Users interact with the smart contract directly via the UI, depositing a designated token amount. They can effortlessly set their lock duration (between 1 minute and 1 year) using an intuitive range slider or a precise numeric input.
3. **Secure Holding:** The immutable Soroban smart contract transfers the tokens from the user's wallet into its own decentralized custody.
4. **Maturity & Withdrawal:** Once the current ledger timestamp surpasses the user-specified unlock duration, the user can call the `withdraw` function to instantly reclaim their funds. Premature withdrawal attempts will be mathematically rejected by the underlying Soroban VM.

## ✨ Features
- **100% Permissionless Nature**: The core contract operates completely without a central admin or escrow agent. Any user can interact and generate their own lock timeline trustlessly.
- **Abstracted Complexity**: Locks represent precise Unix timestamps mathematically under the hood, but this is entirely hidden from the user interface.
- **Smart Duration Inputs**: Users flexibly manage lockups by dragging a responsive timeline slider, or by typing exact duration seconds to dynamically calculate real-time unlock calendar dates automatically.
- **Refined Glassmorphic UI**: Fast, responsive, dark-mode vanilla JS interface structured for an optimal user experience featuring expressive typography like *Big Shoulders Display*.

## 🔗 Deployed Smart Contract Link
**[View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CA42QQ62UQSW3LY7FZ4ZSIXPW4IJX7J5RBW6UZHOMX7YBWPID5LPTR5T)**

**[View Transaction on Stellar.Expert](https://stellar.expert/explorer/testnet/tx/c74b6efd527cc270b00e128b7fdd77d52a76eabfc4065d569ddf331fcde4858c)**

## 🆔 Contract ID 
`CA42QQ62UQSW3LY7FZ4ZSIXPW4IJX7J5RBW6UZHOMX7YBWPID5LPTR5T`

## 🧾 Transaction Hash
`954835388e22249bf4515ece830b17849c8a28b3217978513c6b9f35e7861651`

---

### 📸 Transaction Screenshot (Successful Testnet Transaction)
![Transaction Screenshot Placeholder](./screenshots/Transaction-Screenshot-01.png)

### 📸 Deployed Smart Contract Screenshot (Transaction hash)
![Deployed Contract Placeholder](./screenshots/Deployed-SmartContract-Screenshot.png)

### 📸 UI Screenshot
![UI Screenshot Placeholder](./screenshots/level-5/UI-02.png)

### 📸 Mobile Responsive View
![Mobile Responsive View](./screenshots/level-5/mobile-UI-02.png)

### 📸 Test Output
![test output showing 3+ tests passing](./screenshots/test-output-02.png)

### 📸 CI/CD Pipeline
![CI/CD Pipeline running](./screenshots/level-5/Screenshot-of-cicd-02.png)
![CI/CD Pipeline running](./screenshots/level-5/Screenshot-of-cicd-03.png)

---

## 🏗️ Architecture (High-Level Flow)
```mermaid
graph TD
    A[User] -->|Interacts with UI| B(Frontend: HTML/CSS/JS)
    B -->|Connects Wallet| C{Freighter Wallet}
    C -->|Approves Tx| B
    B -->|RPC Calls| D[Stellar Testnet Node]
    D -->|Executes| E((Soroban Smart Contract))
    E -->|Hold Funds| F[(Time-Locked Vault)]
    E -->|Release Funds| C
```

## 🛣️ Pipeline (Development Plan)
```mermaid
flowchart LR
    subgraph Phase 1: Planning
        A[Define Requirements] --> B[Architecture Design]
    end
    subgraph Phase 2: Smart Contracts
        B --> C[Develop Rust Contract]
        C --> D[Write Unit Tests]
    end
    subgraph Phase 3: Frontend
        D --> E[Design UI/UX]
        E --> F[Implement Vanilla JS]
    end
    subgraph Phase 4: Integration
        F --> G[Freighter Wallet Connect]
        G --> H[Soroban RPC Integration]
    end
    subgraph Phase 5: Finalization
        H --> I[GitHub Actions CI/CD]
        I --> J[Testnet Deployment]
    end
```

## 🛠️ Tech Stack
- **Smart Contract Ecosystem**: Rust, Soroban SDK
- **Network**: Stellar Testnet
- **App Frontend**: HTML5, CSS3 (Custom Glassmorphisim), Vanilla JavaScript (ES6) 
- **Build Tooling**: Vite
- **Wallet Integration**: `@stellar/freighter-api`
- **Blockchain Interaction API**: `@stellar/stellar-sdk`

## 🛠️ Setup Instructions (How to run locally)

### Prerequisites
- Node.js (v20 or higher recommended)
- Rust and Cargo (for smart contract compilation, optional for frontend)
- Freighter Wallet extension installed in your browser

### Running the Frontend
1. Clone the repository and navigate to the project directory.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the local URL provided by Vite in your browser.

## 📂 Project Structure
```text
Time-Locked-Savings/
├── contracts/
│   └── time_locked_savings/   # Core Soroban Smart Contract
│       ├── src/
│       │   ├── lib.rs         # The TimeLockedSavings Rust Contract logic
│       │   └── test.rs        # Contract Unit tests
│       └── Cargo.toml         # Rust dependencies
├── frontend/                  # Vanilla JS Frontend built with Vite
│   ├── docs/                  # Documentation sub-site
│   ├── index.html             # Main dApp Interface
│   ├── style.css              # Custom styling UI and animations
│   ├── main.js                # Stellar SDK and Freighter API interactions
│   ├── vite.config.js         # Vite build configuration
│   └── package.json           # Frontend dependencies 
└── README.md                  # Project documentation
```

## 🔮 Future Enhancements
- **Fee Sponsorship**: Implement gasless transactions using Stellar's fee bump feature so users do not need to hold native XLM just to pay for network fees.
- **Google Authentication**: Create user-specific integrations using Google Auth for streamlined account management and personalized experiences.
- **Website Improvements**: Make the dApp more functional and user-friendly by creating a dedicated navigation bar, adding a robust features page, and expanding the existing documentation pages.

## 🌐 Live Demo
[Live demo link](https://timevault.007575.xyz)

## 🎥 Minimum Viable Product (Demo Video)
[MVP](https://drive.google.com/file/d/1UOkYQjGgEmQkywJZ5wpjTa1eESZlOQ_G/view?usp=sharing)

## 📝 Level 5 Feedbacks & Improvement Section

### 👥 User Feedback Wallets
| User | Wallet Address |
| :--- | :--- |
| User 01 | `GBVGGKESL3MSWIQB6F64HKJKDRKNB3IHFJQT6AK7YOWPZDKPRFL4XMXS` |
| User 02 | `GA6XN7NQ3RYRBR44KEJOP67ED4LTTHKEOLFQNE4YHX6P2AUUHRTBVU7F` |
| User 03 | `GCMVKGLB7TSOU5E5354ALZHUFKXYSKRDB5XWTNWV36DSTBFZUXXQ7VDG` |
| User 04 | `GCGCJDHNSBVN7ILWV4M636O7ZT3FPIHVPD2IC5SBBTMQWRD5GJ4M6L36` |
| User 05 | `GAKRKYDMLFMXDYJAD3VYKDFYZGPACZZ4GDCAG5DWQSLQ5WQIZK6KZ4AD` |

---

- [Google Form](https://forms.gle/AUs5U4Du1oURL8jU7)
- [Feedback Responses Google sheet](https://docs.google.com/spreadsheets/d/1rvzfpsDSV-m4lZD0aDTtPeHgy4KvIEIp7fI9gz0iJlY/edit?usp=sharing)
- [Feedback Responses Google sheet including git commits](https://docs.google.com/spreadsheets/d/1bJM-fENmiJJDckouTgFVd47WRLBnSs3UNX8JO2_X-1E/edit?usp=sharing)
- [Proper Documentaion](./level-5-feedback.md)

### 📊 Feedback Implementation Review
Based on the feedback received from the testing cohort, we implemented several major improvements:

| Feedback Category | User Feedback Highlights | Implementation / Action Taken |
| :--- | :--- | :--- |
| **Documentation** | "Not enough instructions", "Can't view docs without connecting wallet" | Created a dedicated `/docs` page explaining usage steps and made it accessible globally. |
| **Responsiveness** | "Docs and links are overflowing" | Fixed CSS media queries and added text-wrapping for long strings (like Contract IDs) on mobile/laptop. |
| **Core Features** | "Transaction history list missing" | Built a robust History tab tracking individual deposits with **live running timers**. |
| **Wallet Integration** | Needed a way to view native XLM balance without leaving app | Added a **"Check Balance"** feature to instantly fetch real-time XLM balances. |
| **Smart Contract** | "More than one deposit can't happen" | Completely rewrote the Rust contract to support **multiple simultaneous deposits** per user without failing. |
| **UX Quality of Life** | Hard to test with long wait times | Lowered the minimum lock duration from 60 seconds down to **1 second** (range: 1 to 31,536,000 seconds) for easier testing. |
| **UI Polish** | "Simple and unique UI", minor styling tweaks | Refined the NeoBrutalist UI, replaced emojis with crisp SVG icons, and fixed button alignments. |
