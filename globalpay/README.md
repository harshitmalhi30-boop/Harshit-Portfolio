# GlobalPay — “Send Money Anywhere, Anytime”
### Cross-Border Multi-Currency Payment Platform & Fintech Application

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.14-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20Schema-336791.svg)](database/schema.sql)
[![Tailwind CSS](https://img.shields.io/badge/Frontend-TailwindCSS%20%7C%20Lucide-38B2AC.svg)](https://tailwindcss.com)
[![Fintech Sandbox](https://img.shields.io/badge/Environment-Sandbox%20Simulation-10B981.svg)](#financial-safety-disclosures)

GlobalPay is a modern, secure, and professional cross-border payment platform designed to send, receive, convert, and manage money internationally across **9 global currencies** (USD, EUR, GBP, INR, CAD, AUD, AED, SGD, JPY).

---

## 🌟 Key Highlights & Architecture

- **True Interbank Mid-Market Exchange Rates**: Real-time foreign exchange integration with live updates, transparent pricing, 0% hidden markups, and historical 7-day sparkline charts.
- **Multi-Currency Virtual Wallets**: View balances separately and convert instantly between 9 major fiat currencies.
- **Guided 5-Step Send Money Wizard**: Follows the complete regulated remittance flow:
  $$\text{Recipient} \longrightarrow \text{Amount \& Live Rates} \longrightarrow \text{Payment Method} \longrightarrow \text{2FA Verification} \longrightarrow \text{Status \& Digital Receipt}$$
- **Fintech Sandbox Security & Compliance**: Strict PCI-DSS data safeguarding (tokenized payment instruments, no raw PAN/CVV storage), Tiered KYC/AML screening, two-factor authentication (TOTP/SMS), device session management, and immutable audit logs.
- **Dual Perspective**: Fully functional client portal + dedicated **Compliance & Admin Operations Dashboard**.
- **Printable Digital Receipts**: Generates cryptographic SHA-256 tamper-evident receipts formatted for print and export.

---

## 📱 20 Main Screens & Views

| Screen # | Screen Name | Description |
|---|---|---|
| **1** | **Splash Screen** | Animated brand logo, value proposition, and quick launch triggers. |
| **2** | **Onboarding Tour** | 3-step carousel detailing borderless reach, zero hidden fees, and bank-grade security. |
| **3** | **Login** | Secure authentication with email/phone, biometric simulation, and Google/Apple SSO. |
| **4** | **Sign Up** | Registration with Personal vs. Business account types, country selection, and password strength evaluation. |
| **5** | **OTP Verification** | 6-digit individual digit keypad, countdown resend timer, and quick demo autofill. |
| **6** | **KYC Verification** | Tiered limits ($1k Basic $\rightarrow$ $25k Verified $\rightarrow$ Unlimited), document upload preview, and facial liveness check. |
| **7** | **Home Dashboard** | Portfolio total in USD, currency wallet carousel, quick send avatars, live FX ticker, and recent ledger. |
| **8** | **Send Money** | Full international transfer flow with live fee calculation, guaranteed recipient amount, and delivery timeline. |
| **9** | **Receive Money** | Dynamic QR code generation, dedicated virtual IBAN, ACH routing, Sort Code, and UPI IDs per currency. |
| **10** | **Currency Converter** | Real-time exchange calculator, inverse rates, 7-day trend chart (Chart.js), and popular FX pairs. |
| **11** | **Multi-Currency Wallet** | 9 currency cards with individual account details, deposit, send, and conversion capabilities. |
| **12** | **Add Money (Deposit)** | Simulated instant deposit via ACH, Debit Card, or Wire transfer with instant wallet balance update. |
| **13** | **Beneficiaries** | Directory of saved international recipients with favorite stars, bank info, and one-click quick send. |
| **14** | **Transaction History** | Searchable and multi-filtered ledger (by currency, status, date, and transaction type) with CSV export. |
| **15** | **Transaction Details** | Comprehensive drawer displaying timeline, fee breakdown, exchange rate applied, and regulatory check marks. |
| **16** | **Digital Receipt** | Official invoice with QR verification code, SHA-256 cryptographic signature, and print-ready CSS. |
| **17** | **Notifications Center** | Categorized alerts for transfers, KYC status, exchange rate fluctuations, and security warnings. |
| **18** | **Profile & Settings** | Personal profile management, residential address, KYC verification tier, and primary base currency. |
| **19** | **Security Settings** | 2FA toggle, active device session revocation, auto-logout inactivity timer, and security audit log. |
| **20** | **Help & Support** | Searchable FAQ accordion and interactive 24/7 AI Concierge chat simulator. |
| **★** | **Admin Dashboard** | Operator panel for KYC review (Approve/Reject), user risk scoring, AML velocity alerts, and FX margin controls. |

---

## 📂 Project Directory Structure

```text
d:\Portfolio\globalpay\
├── backend/
│   ├── main.py              # FastAPI REST application & static file server
│   ├── fx_service.py        # Real-time exchange rate engine with caching & fallback
├── database/
│   ├── schema.sql           # PostgreSQL production schema (13 tables, indexes, triggers)
│   └── seed_data.sql        # Realistic demo seed data
├── static/
│   ├── index.html           # Single-Page Application container (all 20 screens + admin)
│   ├── css/
│   │   └── style.css        # Custom styles, glassmorphism, and print stylesheet
│   └── js/
│       └── app.js           # Client-side state manager, routing, QR generator, FX calculator
├── run.py                   # One-click Python launcher (uvicorn + auto browser launch)
├── start.bat                # Windows double-click launch script
└── README.md                # System documentation
```

---

## 🗄️ Database Architecture (`schema.sql`)

The application is backed by a PostgreSQL database schema with 13 core tables:

1. **`users`**: Core credentials, roles (`USER`, `ADMIN`, `COMPLIANCE`), lockout timestamps, 2FA settings.
2. **`user_profiles`**: Personal details, tax ID, tier level (1 to 3), address, preferred currency.
3. **`kyc_records`**: Document metadata, front/back image links, selfie links, PEP/sanctions check flags, risk scores.
4. **`currencies`**: 9 supported international currencies, symbols, limits, decimals, deposit/withdrawal fees.
5. **`wallets`**: Balances, reserved balances, virtual account numbers, routing numbers per user per currency.
6. **`exchange_rates`**: Mid-market rates, markup percentages, effective buy/sell rates, and timestamps.
7. **`beneficiaries`**: Saved recipients, country, IBAN/account number, routing code, favorite status.
8. **`payment_methods`**: Tokenized cards and linked bank accounts (strictly PCI-DSS compliant).
9. **`transactions`**: Complete ledger of transfers, conversions, fees, FX rates, status, and compliance tracking.
10. **`transaction_receipts`**: Receipts with SHA-256 verification hash and PDF download tracking.
11. **`notifications`**: Categorized alerts (Transfer, KYC, Rate Alert, Security).
12. **`security_events`**: Device fingerprints, IP addresses, logins, and session timeouts.
13. **`audit_logs`**: Immutable administrative and compliance action records.

---

## 🚀 How to Run Locally

### Option 1: Double-Click Launcher (Windows)
Double-click `start.bat` in `d:\Portfolio\globalpay\`.

### Option 2: Python Terminal
Open PowerShell or Command Prompt in the project folder:
```powershell
cd d:\Portfolio\globalpay
python run.py
```

The application will start on **`http://localhost:8000`** and automatically open your default browser.
Interactive OpenAPI / Swagger documentation is available at **`http://localhost:8000/docs`**.

---

## 🔑 Demo Sandbox Credentials & Testing Tips

- **User Portal**:
  - Email: `harshit@globalpay.io`
  - Demo OTP / 2FA Code: `123456`
  - Pre-funded multi-currency wallets (~$34,800 USD equivalent across 9 currencies).
- **Admin Portal**:
  - Click **"Admin Mode"** in the top navigation bar or select **"★ Admin Dashboard"** from the screen switcher.
  - Review and approve pending KYC submissions for international customers.
  - Inspect AML alerts and dynamically adjust platform FX markup percentages.
- **Quick Screen Jump**: Use the **"Jump to Screen"** dropdown in the top header to instantly inspect any of the 20 main screens at any time.

---

## 🛡️ Financial Safety & Regulatory Disclosures

> [!IMPORTANT]
> **Fintech Prototype Sandbox Disclaimer**:
> This software is a fintech application prototype for demonstration and evaluation purposes.
> - No real money or live banking transactions are processed.
> - External payment rails and card networks are simulated using sandbox tokens.
> - In a production deployment, real financial movement requires licensing as an Authorized Payment Institution (API) or Money Services Business (MSB) with registered banking partners (e.g., Stripe, Adyen, Plaid, or licensed partner banks).
> - Production deployments require integration with automated PEP/Sanctions screening (e.g., ComplyAdvantage, OFAC, Refinitiv World-Check) and full KYC/AML workflows.
