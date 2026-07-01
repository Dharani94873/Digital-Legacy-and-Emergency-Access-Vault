# 🛡️ Digital Legacy & Emergency Access Vault

An enterprise-grade, highly secure document vault designed to protect your most critical files (legal, medical, insurance) and ensure they seamlessly transfer to trusted nominees during emergencies. Built with Next.js 15, AES-256-GCM encryption, and Polygon Blockchain verification.

![Digital Legacy Vault Banner](https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop)

---

## ✨ Key Features

### 🔐 Zero-Knowledge Architecture
- **Client-Side/Server-Side Encryption**: All documents are fully encrypted using **AES-256-GCM** before being securely stored on Cloudinary. The system never stores raw documents.
- **Blockchain Integrity (Polygon)**: Every time a file is uploaded, a SHA-256 hash of the file is stamped on the **Polygon Amoy testnet** via a smart contract. Anyone can cryptographically verify that a document has not been tampered with since the time it was uploaded.

### 👥 Trusted Nominee System
- **Invite Nominees**: Vault owners can invite trusted family members or lawyers to act as "Nominees".
- **Granular Access Control**: Choose exactly which folders or files a nominee is allowed to request access to.

### 🚨 Emergency Access Workflow
- **Automated Dead-Man's Switch**: If a nominee requests access to the vault (e.g., during a medical emergency), the Owner is notified immediately.
- **Configurable Waiting Periods**: If the owner is incapacitated and cannot explicitly "Approve" or "Reject" the request within a pre-defined waiting period (e.g., 7, 15, or 30 days), the system **auto-approves** the request and grants the nominee access to the encrypted documents.

### 📊 Comprehensive Auditing
- Every action taken in the system (logins, file uploads, file downloads, emergency requests) is strictly logged with IP addresses, timestamps, and browser user agents.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Shadcn/UI
- **Backend**: Next.js API Routes, NextAuth v5 (Authentication)
- **Database**: MongoDB Atlas (Mongoose ORM)
- **Storage**: Cloudinary (Encrypted blob storage)
- **Blockchain**: Solidity, Hardhat, Ethers.js, Polygon Amoy Testnet
- **Emails**: Resend API (Transactional HTML emails)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas Database Connection String
- A Cloudinary Account
- A Resend API Key
- A Polygon Amoy RPC URL & Wallet Private Key

### 1. Clone the repository
```bash
git clone https://github.com/Dharani94873/Digital-Legacy-and-Emergency-Access-Vault.git
cd Digital-Legacy-and-Emergency-Access-Vault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root of the project and add the following keys:
```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/vault

# NextAuth
NEXTAUTH_SECRET=your_super_secret_key
NEXTAUTH_URL=http://localhost:3000

# Encryption (Must be exactly 32 bytes/64 hex characters)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend Emails
RESEND_API_KEY=re_your_api_key

# Blockchain (Polygon Amoy)
NEXT_PUBLIC_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_metamask_private_key
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

### 4. Deploy Smart Contract (Optional)
If you want to use your own contract instead of the default one:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network amoy
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How to Use the App

### For Owners:
1. **Register**: Create an account as an Owner.
2. **Upload Documents**: Navigate to your Documents tab and upload files (PDFs, Images). They are automatically encrypted and hashed to the blockchain.
3. **Invite Nominees**: Go to the Nominees tab and send email invitations. Specify how many days the system should wait before auto-approving their emergency requests.
4. **Manage Requests**: If a nominee requests access, you will see it in your Dashboard and receive an email. You can manually approve or reject it at any time.

### For Nominees:
1. **Accept Invitation**: Click the secure link in your email to register as a Nominee.
2. **Dashboard**: View the Owners you are connected to.
3. **Request Access**: In an emergency, click "Request Access" for a specific owner. You must provide a valid reason.
4. **Access Documents**: Once approved (manually by the owner, or automatically after the waiting period expires), you can download and decrypt the owner's files.

---

## 🛡️ Security Notice
This application is built for educational and demonstration purposes. While it uses industry-standard AES-256-GCM encryption, it is highly recommended to conduct a professional security audit before using it to store highly sensitive real-world medical or legal documents.

---

### License
MIT License
