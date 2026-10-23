# PocketLedger — Professional Offline-First Personal Finance Manager

PocketLedger is a privacy-first, commercial-grade personal finance application designed for Windows desktops, Android, iOS, and tablets. It stores 100% of your financial records directly on your local device using **IndexedDB**, guaranteeing complete offline autonomy with **zero telemetry, no external databases, no cloud subscriptions, and zero advertisements**.

---

## 🌟 Key Features

1. **True Offline-First Architecture**
   - Operates seamlessly without an active internet connection after initial load.
   - Built with modern Progressive Web App (PWA) standards, service workers, and local Workbox asset precaching.
   - Live offline/online status indicator.

2. **Precision Double-Entry & Integer Minor Units**
   - All financial numbers are stored in integer minor units (e.g. Paisas / Cents) to prevent floating-point calculation drift.
   - Dedicated transfer engine: safely moves balances between accounts without distorting consolidated income and expense reports.

3. **Executive Dashboard & SVG Visualizations**
   - Net balance, total income, total expenditures, net savings, and savings rate.
   - Responsive, zero-CDN interactive SVG charts: 6-month monthly cashflow comparison and category spending donut.
   - Real-time budget warning indicators (75% warning and 100% over-budget thresholds).
   - Date range selector: This Month, Last Month, This Year, All Time, or Custom Range.

4. **Multi-Account & Multi-Currency Management**
   - Supports Cash in Hand, Bank Accounts, Mobile Wallets (e.g., JazzCash, Easypaisa, SadaPay, Nayapay), and Custom accounts.
   - Grouped currency balances (defaulting to PKR with USD, EUR, GBP, SAR, AED support). Currencies are never silently co-mingled.
   - Account deletion protection: accounts with active transaction history cannot be deleted accidentally.

5. **Budgets & Categorization**
   - Monthly and custom-period category budgets with customizable warning thresholds.
   - Customizable income streams and expense categories with color palettes.

6. **Automated Recurring Transactions**
   - Schedule weekly, monthly, and yearly recurring expenses or incomes (e.g. rent, bills, salaries).
   - Deduplication protection: uses deterministic occurrence keys (`recId_dueDate`) to ensure entries are never posted twice.
   - Local execution upon application launch with clear transparency notices.

7. **Encrypted Backups & Portability**
   - Plaintext or AES-GCM 256-bit passphrase-encrypted JSON backup export (using Web Crypto API with PBKDF2 key derivation).
   - Backup inspection and preview modal with **Merge** vs **Replace** restoration modes.
   - RFC 4180 compliant CSV export for spreadsheet software (Excel, LibreOffice, Google Sheets).
   - Print-optimized financial statement layout for browser "Save as PDF".

8. **Security & App Passcode**
   - Optional local keypad lock with PBKDF2 salted hash verifier.
   - No hardcoded secrets, no third-party scripts.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript (Strict Mode)
- **Tooling & Build**: Vite 6, Tailwind CSS 3
- **Local Database**: IndexedDB (via `idb` Promise wrapper)
- **PWA & Offline**: `vite-plugin-pwa` & Service Worker
- **Icons**: Lucide Icons
- **Cryptography**: Web Crypto API (`crypto.subtle`)
- **Testing**: Vitest 2

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js v18 or newer
- npm v9 or newer

### 1. Installation
Open PowerShell or Command Prompt inside the project folder:
```powershell
cd D:\PocketLedger
npm install
```

### 2. Run the Development Server
```powershell
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 3. Run Automated Tests
```powershell
npm test
```
All unit tests for financial calculations, account balance reconciliations, recurring transaction deduplication, Web Crypto AES-GCM backups, and CSV generation will execute.

### 4. Build for Production & Preview
```powershell
npm run build
npm run preview
```

---

## 📲 Installation Instructions (PWA)

### Windows / Mac / Linux (Chrome, Edge, Brave)
1. Open `http://localhost:5173` (or your hosted HTTPS address) in Google Chrome or Microsoft Edge.
2. In the right side of the address bar, click the **Install PocketLedger** icon (or click the three dots menu `⋮` > **Install PocketLedger**).
3. The app is now installed on your desktop as an independent native window and works 100% offline.

### Android (Chrome / Brave / Firefox)
1. Navigate to the app URL on your Android device.
2. Tap the top-right menu icon (`⋮`).
3. Select **"Install App"** or **"Add to Home Screen"**.
4. An app icon will appear in your app drawer and home screen.

### iPhone / iPad (Safari)
1. Open the app URL in **Safari** on iOS.
2. Tap the **Share** button (box with an arrow pointing upward) at the bottom toolbar.
3. Scroll down the sheet and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right. PocketLedger will now launch in full-screen standalone mode.

---

## 🔒 Security & Data Persistence Notice

- **Local IndexedDB**: All records exist strictly inside the local browser profile.
- **Cache Clearing Warning**: If browser history/cookies/site data is cleared, browser databases may be wiped. Keep regular encrypted JSON backups exported to your Downloads or a secure USB drive.
- **Application Lock**: The PIN passcode protects against casual shoulder-surfing on shared computers; it does not replace operating system full-disk encryption (such as BitLocker).
