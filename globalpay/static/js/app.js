/**
 * GlobalPay - Core Application Logic
 * Send Money Anywhere, Anytime
 * Single-Page Fintech Application & Banking Engine
 */

class GlobalPayApp {
  constructor() {
    this.currentScreen = 'dashboard';
    this.isAdminMode = false;
    this.balanceVisible = true;
    this.activeReceiptData = null;
    this.activeSendBeneficiary = null;
    this.activeSendQuote = null;
    this.chartInstance = null;
    this.onboardingStep = 1;

    // Currency Definitions & Metadata
    this.currencies = {
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, country: 'United States', bank: 'Evolve Bank & Trust / ACH' },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, country: 'European Union', bank: 'Deutsche Bank / SEPA Instant' },
      GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2, country: 'United Kingdom', bank: 'Barclays Bank / Faster Payments' },
      INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2, country: 'India', bank: 'HDFC Bank / UPI Express' },
      CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', decimals: 2, country: 'Canada', bank: 'RBC Royal Bank / Interac' },
      AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2, country: 'Australia', bank: 'ANZ Bank / PayID & NPP' },
      AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', decimals: 2, country: 'United Arab Emirates', bank: 'Emirates NBD / Local Central' },
      SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2, country: 'Singapore', bank: 'DBS Bank / FAST & PayNow' },
      JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0, country: 'Japan', bank: 'MUFG Bank / Zengin Direct' }
    };

    // Live FX Rates Cache (vs 1 USD)
    this.fxRates = {
      USD: 1.0,
      EUR: 0.9220,
      GBP: 0.7850,
      INR: 83.4250,
      CAD: 1.3590,
      AUD: 1.5240,
      AED: 3.6725,
      SGD: 1.3420,
      JPY: 151.9000
    };

    // App State
    this.user = {
      id: "usr_998144a1",
      name: "Harshit Malhi",
      email: "harshit@globalpay.io",
      phone: "+1 (555) 234-5678",
      country: "USA",
      tier: 2,
      tierName: "Tier 2 Verified",
      dailyLimit: 25000,
      twoFactorEnabled: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
    };

    this.wallets = [
      { code: 'USD', balance: 14850.50, account: '489201948102', routing: '121000358', type: 'ACH Checking' },
      { code: 'EUR', balance: 4210.00, account: 'DE89370400440532013000', routing: 'DBEUT38XXX', type: 'SEPA Virtual IBAN' },
      { code: 'GBP', balance: 2850.25, account: '90812345', routing: '20-00-00', type: 'UK Faster Payments' },
      { code: 'INR', balance: 125000.00, account: '919876543210', routing: 'HDFC0001234', type: 'UPI & NEFT' },
      { code: 'CAD', balance: 3100.00, account: '88710294', routing: '0001-12345', type: 'Interac / EFT' },
      { code: 'AUD', balance: 1950.00, account: '123-456 98765432', routing: 'BSB 082-001', type: 'PayID NPP' },
      { code: 'AED', balance: 8400.00, account: 'AE070331234567890123456', routing: 'EIBUAE2D', type: 'UAE Local' },
      { code: 'SGD', balance: 2400.00, account: '7171-081-998877', routing: 'DBSSSGSG', type: 'FAST / PayNow' },
      { code: 'JPY', balance: 380000.00, account: '7810293', routing: '0005-012', type: 'Zengin Express' }
    ];

    this.beneficiaries = [
      {
        id: "ben_1",
        full_name: "Eleanor Vance",
        nickname: "Eleanor (UK)",
        email: "eleanor.v@techpartners.co.uk",
        country_code: "GBR",
        currency_code: "GBP",
        bank_name: "Barclays Bank UK",
        account_identifier_type: "ACCOUNT_NUMBER",
        account_identifier: "89201940",
        routing_code: "20-04-15",
        relationship: "Business Partner",
        is_favorite: true
      },
      {
        id: "ben_2",
        full_name: "Aarav Sharma",
        nickname: "Aarav (Family)",
        email: "aarav.sharma@gmail.com",
        country_code: "IND",
        currency_code: "INR",
        bank_name: "HDFC Bank",
        account_identifier_type: "UPI_ID",
        account_identifier: "aarav.sharma@okhdfcbank",
        routing_code: "HDFC0000240",
        relationship: "Family Member",
        is_favorite: true
      },
      {
        id: "ben_3",
        full_name: "Markus Weber",
        nickname: "Markus (Munich)",
        email: "m.weber@designstudio.de",
        country_code: "DEU",
        currency_code: "EUR",
        bank_name: "Deutsche Bank Frankfurt",
        account_identifier_type: "IBAN",
        account_identifier: "DE44500700100987654321",
        routing_code: "DEUTDEDDFXX",
        relationship: "Consultant",
        is_favorite: false
      },
      {
        id: "ben_4",
        full_name: "Kenji Takahashi",
        nickname: "Kenji (Tokyo)",
        email: "kenji.t@venturejapan.jp",
        country_code: "JPN",
        currency_code: "JPY",
        bank_name: "Mitsubishi UFJ Bank",
        account_identifier_type: "ACCOUNT_NUMBER",
        account_identifier: "7810293",
        routing_code: "MUFGJPJT",
        relationship: "Contractor",
        is_favorite: false
      }
    ];

    this.transactions = [
      {
        id: "tx_101",
        reference_number: "GP-202610-F92B10",
        transaction_type: "SEND_MONEY",
        sender_currency: "USD",
        sender_amount: 1200.00,
        exchange_rate: 83.4250,
        transfer_fee: 3.99,
        total_charged: 1200.00,
        recipient_currency: "INR",
        recipient_amount: 99797.30,
        beneficiary_name: "Aarav Sharma",
        payment_channel: "UPI Instant Express",
        status: "COMPLETED",
        date: "Today, 13:25 UTC",
        purpose: "Family Support & Maintenance",
        payment_method: "USD Wallet"
      },
      {
        id: "tx_102",
        reference_number: "GP-202610-A19C48",
        transaction_type: "SEND_MONEY",
        sender_currency: "USD",
        sender_amount: 2500.00,
        exchange_rate: 0.7842,
        transfer_fee: 6.25,
        total_charged: 2500.00,
        recipient_currency: "GBP",
        recipient_amount: 1955.59,
        beneficiary_name: "Eleanor Vance",
        payment_channel: "UK Faster Payments",
        status: "COMPLETED",
        date: "Yesterday",
        purpose: "Consultancy & Design Services",
        payment_method: "Chase Sapphire Visa Debit"
      },
      {
        id: "tx_103",
        reference_number: "GP-202609-C38B01",
        transaction_type: "CONVERT_CURRENCY",
        sender_currency: "USD",
        sender_amount: 1500.00,
        exchange_rate: 0.9215,
        transfer_fee: 2.25,
        total_charged: 1500.00,
        recipient_currency: "EUR",
        recipient_amount: 1380.18,
        beneficiary_name: "EUR Wallet Balance",
        payment_channel: "Internal Ledger Conversion",
        status: "COMPLETED",
        date: "Sep 28, 2026",
        purpose: "Currency Hedging",
        payment_method: "USD Wallet"
      },
      {
        id: "tx_104",
        reference_number: "GP-202609-E88F92",
        transaction_type: "RECEIVE_MONEY",
        sender_currency: "EUR",
        sender_amount: 850.00,
        exchange_rate: 1.0000,
        transfer_fee: 0.00,
        total_charged: 850.00,
        recipient_currency: "EUR",
        recipient_amount: 850.00,
        beneficiary_name: "Markus Weber",
        payment_channel: "SEPA Direct Deposit",
        status: "COMPLETED",
        date: "Sep 26, 2026",
        purpose: "Invoice Settlement #1042",
        payment_method: "SEPA Direct"
      },
      {
        id: "tx_105",
        reference_number: "GP-202609-K99D12",
        transaction_type: "SEND_MONEY",
        sender_currency: "USD",
        sender_amount: 3200.00,
        exchange_rate: 151.85,
        transfer_fee: 8.50,
        total_charged: 3200.00,
        recipient_currency: "JPY",
        recipient_amount: 484644,
        beneficiary_name: "Kenji Takahashi",
        payment_channel: "Zengin Express Wire",
        status: "PROCESSING",
        date: "1 hour ago",
        purpose: "Freelance Dev Milestone #2",
        payment_method: "USD Wallet"
      }
    ];

    this.notifications = [
      { id: "notif_1", title: "Transfer In Progress", message: "Your transfer of 3,200 USD to Kenji Takahashi is processing via Zengin network.", category: "TRANSFER", is_read: false, time: "45m ago" },
      { id: "notif_2", title: "Transfer Completed", message: "Transfer of 1,200 USD (₹99,797.30 INR) to Aarav Sharma was delivered successfully.", category: "TRANSFER", is_read: false, time: "3h ago" },
      { id: "notif_3", title: "KYC Verification Approved", message: "Your Tier 2 identity verification has been confirmed! Your daily transfer limit is now $25,000 USD.", category: "KYC", is_read: true, time: "12d ago" },
      { id: "notif_4", title: "FX Market Alert: USD/EUR", message: "EUR exchange rate rose by +0.45% in the last 24 hours. Great time to convert!", category: "RATE_ALERT", is_read: true, time: "1d ago" },
      { id: "notif_5", title: "New Login Detected", message: "Successful login from Chrome on Windows (San Francisco, CA, IP: 198.51.100.24).", category: "SECURITY", is_read: true, time: "2d ago" }
    ];

    this.adminKycQueue = [
      { id: "kyc_q1", user_name: "Liam O'Connor", user_email: "liam.oc@dublintech.ie", country: "IRL", doc_type: "PASSPORT", doc_num: "PA9821443", risk: "12%", status: "PENDING", time: "2h ago" },
      { id: "kyc_q2", user_name: "Priya Patel", user_email: "priya.patel@mumbai.in", country: "IND", doc_type: "NATIONAL_ID", doc_num: "AADHAAR-8901", risk: "8.5%", status: "PENDING", time: "5h ago" },
      { id: "kyc_q3", user_name: "Carlos Rodriguez", user_email: "carlos.r@madrid.es", country: "ESP", doc_type: "DRIVERS_LICENSE", doc_num: "ES-D-881920", risk: "28%", status: "PENDING", time: "9h ago" }
    ];

    this.adminRiskAlerts = [
      { id: "ra_1", severity: "HIGH", title: "Velocity Spike Flag", desc: "User #4901 attempted 4 transfers totaling $38,000 in 12 mins to high-risk corridor.", time: "1h ago" },
      { id: "ra_2", severity: "MEDIUM", title: "Sanctions Fuzzy Match", desc: "Beneficiary match 87% with OFAC list. Automated compliance hold applied.", time: "4h ago" }
    ];

    this.init();
  }

  init() {
    this.fetchLiveRates();
    this.renderAll();
    this.setupListeners();
    this.navigateTo('dashboard');
  }

  // Fetch real-time FX rates from our FastAPI endpoint or public fallback
  async fetchLiveRates() {
    try {
      const res = await fetch('/api/rates/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.pairs) {
          data.pairs.forEach(p => {
            this.fxRates[p.currency] = p.rate;
          });
          const inrRate = this.fxRates['INR'] || 83.42;
          const displayEl = document.getElementById('header-rate-display');
          if (displayEl) displayEl.innerText = `${inrRate.toFixed(2)} INR`;
        }
      }
    } catch (e) {
      console.log('Using default rates:', e);
    }
  }

  // Navigation Router supporting all 20 screens
  navigateTo(screenId) {
    this.currentScreen = screenId;

    // Update screen selector dropdown
    const selector = document.getElementById('screen-switcher');
    if (selector) selector.value = screenId;

    // Hide all screens
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update header title & subtitles
    this.updateScreenHeading(screenId);

    // Update active nav item styling
    document.querySelectorAll('.nav-item').forEach(item => {
      const navKey = item.getAttribute('data-nav');
      if (navKey === screenId) {
        item.classList.add('bg-brand-50', 'dark:bg-brand-950/60', 'text-brand-700', 'dark:text-brand-300', 'border-brand-200');
        item.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        item.classList.remove('bg-brand-50', 'dark:bg-brand-950/60', 'text-brand-700', 'dark:text-brand-300', 'border-brand-200');
        item.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });

    // Screen specific triggers
    if (screenId === 'converter') {
      this.calculateConverter();
      setTimeout(() => this.renderFXChart(), 100);
    } else if (screenId === 'receive') {
      this.renderReceiveScreen();
    } else if (screenId === 'send') {
      this.renderSendBeneficiaries();
      this.recalculateSendQuote();
    } else if (screenId === 'onboarding') {
      this.renderOnboardingSlide();
    } else if (screenId === 'admin') {
      this.renderAdminScreen();
    }

    // Refresh icons
    if (window.lucide) lucide.createIcons();
  }

  updateScreenHeading(screenId) {
    const headings = {
      splash: { title: "Welcome to GlobalPay", sub: "Send Money Anywhere, Anytime" },
      onboarding: { title: "Platform Tour", sub: "Discover instant, low-cost international remittances" },
      login: { title: "Secure Login", sub: "Access your global accounts" },
      signup: { title: "Create Account", sub: "Join over 1M+ satisfied global users" },
      otp: { title: "2-Factor Verification", sub: "Verify your one-time authentication passcode" },
      kyc: { title: "Identity Verification & AML", sub: "Tiered compliance verification for global limits" },
      dashboard: { title: "Dashboard", sub: "Overview of your multi-currency balances and recent activity" },
      send: { title: "Send Money Internationally", sub: "Instant transfers with zero hidden fee markups" },
      receive: { title: "Receive Money Worldwide", sub: "Dedicated virtual bank details in 9 global currencies" },
      converter: { title: "Currency Converter", sub: "Live interbank mid-market exchange rate calculator" },
      wallet: { title: "Multi-Currency Wallets", sub: "Manage balances across 9 supported international accounts" },
      add_money: { title: "Deposit Funds", sub: "Add money to your multi-currency balances" },
      beneficiaries: { title: "Saved Beneficiaries", sub: "Manage frequent international recipients" },
      history: { title: "Transaction Ledger", sub: "Complete historical record of transfers and conversions" },
      details: { title: "Transaction Details", sub: "Status timeline, breakdowns, and recipient routing" },
      receipt: { title: "Digital Remittance Receipt", sub: "Cryptographically verified proof of transfer" },
      notifications: { title: "Notifications & Alerts", sub: "Transfers, KYC updates, and security logs" },
      profile: { title: "Profile & Preferences", sub: "Personal identification and base currency settings" },
      security: { title: "Security & Access", sub: "2FA, active devices, and immutable audit logs" },
      support: { title: "24/7 Help & Support", sub: "AI assistance and answers to frequent questions" },
      admin: { title: "Compliance Operations & Admin", sub: "Sanctions monitoring, KYC review, and FX controls" }
    };

    const info = headings[screenId] || { title: "GlobalPay", sub: "Cross-Border Payments" };
    const h1 = document.getElementById('screen-heading');
    const sub = document.getElementById('screen-subheading');
    if (h1) h1.innerText = info.title;
    if (sub) sub.innerText = info.sub;
  }

  // Render core components
  renderAll() {
    this.renderDashboardWallets();
    this.renderDashboardRecentTx();
    this.renderDashboardRatesMini();
    this.renderQuickBeneficiaries();
    this.renderWalletsFullGrid();
    this.renderBeneficiariesList();
    this.renderTransactionHistory();
    this.renderNotificationsList();
    this.renderSecuritySessions();
    this.renderSecurityAuditLogs();
    this.renderAdminScreen();
    this.updateConsolidatedBalance();
    if (window.lucide) lucide.createIcons();
  }

  updateConsolidatedBalance() {
    let totalUsd = 0;
    this.wallets.forEach(w => {
      const rate = this.fxRates[w.code] || 1.0;
      totalUsd += (w.balance / rate);
    });

    const el = document.getElementById('total-balance-display');
    if (el) {
      el.innerText = this.balanceVisible ? `$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••';
    }
  }

  toggleBalanceVisibility() {
    this.balanceVisible = !this.balanceVisible;
    this.updateConsolidatedBalance();
    const icon = document.getElementById('eye-balance-icon');
    if (icon) {
      icon.setAttribute('data-lucide', this.balanceVisible ? 'eye' : 'eye-off');
      if (window.lucide) lucide.createIcons();
    }
  }

  // Dashboard Wallets Carousel / Grid
  renderDashboardWallets() {
    const container = document.getElementById('dashboard-wallets-carousel');
    if (!container) return;

    container.innerHTML = this.wallets.map(w => {
      const meta = this.currencies[w.code] || {};
      const rate = this.fxRates[w.code] || 1.0;
      const usdVal = (w.balance / rate).toFixed(2);

      return `
        <div onclick="app.navigateTo('wallet')" class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-500/40 transition cursor-pointer flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">${meta.flag || '🌐'}</span>
            <span class="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">${w.code}</span>
          </div>
          <div>
            <div class="text-xs text-slate-400 font-medium">${meta.name || w.code}</div>
            <div class="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              ${this.balanceVisible ? `${meta.symbol}${w.balance.toLocaleString()}` : '••••••'}
            </div>
            <div class="text-[11px] text-slate-400 mt-1">≈ $${usdVal} USD</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Dashboard Recent Transactions
  renderDashboardRecentTx() {
    const container = document.getElementById('dashboard-recent-transactions');
    if (!container) return;

    const recent = this.transactions.slice(0, 4);
    container.innerHTML = recent.map(tx => {
      const isSend = tx.transaction_type === 'SEND_MONEY';
      const isReceive = tx.transaction_type === 'RECEIVE_MONEY';
      const isConvert = tx.transaction_type === 'CONVERT_CURRENCY';

      let icon = 'arrow-up-right';
      let iconColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50';
      let sign = '-';

      if (isReceive || tx.transaction_type === 'ADD_MONEY') {
        icon = 'arrow-down-left';
        iconColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50';
        sign = '+';
      } else if (isConvert) {
        icon = 'refresh-cw';
        iconColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50';
        sign = '⇄';
      }

      return `
        <div onclick="app.showTransactionDetails('${tx.id}')" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0">
              <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-white">${tx.beneficiary_name}</div>
              <div class="text-[11px] text-slate-400">${tx.date} • ${tx.payment_channel}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs font-bold font-mono ${sign === '+' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}">
              ${sign} $${tx.sender_amount.toLocaleString()} ${tx.sender_currency}
            </div>
            <div class="text-[10px] text-slate-400 font-mono">
              ${tx.recipient_amount ? `Rec: ${tx.recipient_amount.toLocaleString()} ${tx.recipient_currency}` : tx.status}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Dashboard Live Rates Ticker Mini
  renderDashboardRatesMini() {
    const container = document.getElementById('rates-mini-table');
    if (!container) return;

    const pairs = ['EUR', 'GBP', 'INR', 'CAD', 'JPY'];
    container.innerHTML = pairs.map(code => {
      const meta = this.currencies[code] || {};
      const rate = this.fxRates[code] || 1.0;
      return `
        <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">${meta.flag}</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">USD/${code}</span>
          </div>
          <div class="text-right">
            <span class="font-bold font-mono text-slate-900 dark:text-white">${rate.toFixed(code === 'JPY' || code === 'INR' ? 2 : 4)}</span>
            <span class="text-[10px] text-emerald-500 font-semibold ml-1.5">+0.3%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Frequent Beneficiaries Quick Avatars
  renderQuickBeneficiaries() {
    const container = document.getElementById('quick-send-beneficiaries');
    if (!container) return;

    const items = this.beneficiaries.map(b => {
      const meta = this.currencies[b.currency_code] || {};
      const initials = b.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
      return `
        <div onclick="app.quickSendTo('${b.id}')" class="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md group-hover:scale-105 transition relative">
            ${initials}
            <span class="absolute -bottom-1 -right-1 text-xs">${meta.flag}</span>
          </div>
          <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70px] text-center">${b.nickname || b.full_name}</span>
        </div>
      `;
    }).join('');

    const addBtn = `
      <div onclick="app.openAddBeneficiaryModal()" class="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0">
        <div class="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-brand-500 group-hover:text-brand-500 transition">
          <i data-lucide="plus" class="w-5 h-5"></i>
        </div>
        <span class="text-[11px] font-semibold text-slate-400">Add New</span>
      </div>
    `;

    container.innerHTML = items + addBtn;
  }

  // Multi-Currency Wallets Full Grid
  renderWalletsFullGrid() {
    const container = document.getElementById('wallets-full-grid');
    if (!container) return;

    container.innerHTML = this.wallets.map(w => {
      const meta = this.currencies[w.code] || {};
      const rate = this.fxRates[w.code] || 1.0;
      const usdVal = (w.balance / rate).toFixed(2);

      return `
        <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${meta.flag}</span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">${meta.name}</h3>
                <span class="text-xs text-slate-400 font-mono">${w.code} Wallet</span>
              </div>
            </div>
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">Active</span>
          </div>

          <div>
            <div class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              ${meta.symbol}${w.balance.toLocaleString()}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">≈ $${usdVal} USD Equivalent</div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
            <div class="flex justify-between"><span>Account Number:</span> <span class="font-bold text-slate-800 dark:text-white">${w.account}</span></div>
            <div class="flex justify-between"><span>Routing / Code:</span> <span class="font-bold text-slate-800 dark:text-white">${w.routing}</span></div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onclick="app.depositToCurrency('${w.code}')" class="py-2 px-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-bold text-xs hover:bg-brand-100 flex items-center justify-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Funds
            </button>
            <button onclick="app.sendFromCurrency('${w.code}')" class="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 flex items-center justify-center gap-1">
              <i data-lucide="send" class="w-3.5 h-3.5"></i> Send
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Beneficiaries Management Full List
  renderBeneficiariesList() {
    const container = document.getElementById('beneficiaries-full-list');
    if (!container) return;

    container.innerHTML = this.beneficiaries.map(b => {
      const meta = this.currencies[b.currency_code] || {};
      return `
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${meta.flag}</span>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">${b.full_name}</h3>
                <span class="text-xs text-slate-400">${b.relationship}</span>
              </div>
            </div>
            <button onclick="app.toggleFavoriteBeneficiary('${b.id}')" class="text-${b.is_favorite ? 'amber-500' : 'slate-300'} hover:text-amber-500 p-1">
              <i data-lucide="star" class="w-4 h-4 ${b.is_favorite ? 'fill-amber-500' : ''}"></i>
            </button>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <div><span class="text-slate-400">Bank:</span> <strong>${b.bank_name}</strong></div>
            <div><span class="text-slate-400">${b.account_identifier_type}:</span> <strong class="font-mono">${b.account_identifier}</strong></div>
            <div><span class="text-slate-400">Currency:</span> <strong>${b.currency_code} (${meta.symbol})</strong></div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onclick="app.quickSendTo('${b.id}')" class="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="send" class="w-3.5 h-3.5"></i> Send Money
            </button>
            <button onclick="app.deleteBeneficiary('${b.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Transaction History Table
  renderTransactionHistory() {
    const container = document.getElementById('history-transactions-table');
    if (!container) return;

    if (this.transactions.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No transactions match your search filter.</div>`;
      return;
    }

    container.innerHTML = this.transactions.map(tx => {
      const isCompleted = tx.status === 'COMPLETED';
      const statusColor = isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700';

      return `
        <div onclick="app.showTransactionDetails('${tx.id}')" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 flex items-center justify-center shrink-0 font-bold">
              GP
            </div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">${tx.beneficiary_name}</div>
              <div class="text-slate-400 text-[11px] font-mono">${tx.reference_number} • ${tx.payment_channel}</div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-6">
            <div class="text-left sm:text-right">
              <div class="font-bold font-mono text-sm text-slate-900 dark:text-white">$${tx.sender_amount.toLocaleString()} ${tx.sender_currency}</div>
              <div class="text-[11px] text-slate-400">${tx.date}</div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}">${tx.status}</span>
              <button onclick="event.stopPropagation(); app.showDigitalReceipt('${tx.id}')" class="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100" title="View Receipt">
                <i data-lucide="receipt" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter transactions
  filterTransactions() {
    const q = document.getElementById('filter-search')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('filter-status')?.value || 'ALL';
    const currency = document.getElementById('filter-currency')?.value || 'ALL';
    const type = document.getElementById('filter-type')?.value || 'ALL';

    const filtered = this.transactions.filter(tx => {
      const matchQ = !q || tx.reference_number.toLowerCase().includes(q) || tx.beneficiary_name.toLowerCase().includes(q);
      const matchStatus = status === 'ALL' || tx.status.toUpperCase() === status.toUpperCase();
      const matchCurr = currency === 'ALL' || tx.sender_currency === currency || tx.recipient_currency === currency;
      const matchType = type === 'ALL' || tx.transaction_type === type;
      return matchQ && matchStatus && matchCurr && matchType;
    });

    const container = document.getElementById('history-transactions-table');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No transactions match your query.</div>`;
      return;
    }

    // Re-render filtered rows
    container.innerHTML = filtered.map(tx => {
      const isCompleted = tx.status === 'COMPLETED';
      const statusColor = isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
      return `
        <div onclick="app.showTransactionDetails('${tx.id}')" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 flex items-center justify-center shrink-0 font-bold">GP</div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">${tx.beneficiary_name}</div>
              <div class="text-slate-400 text-[11px] font-mono">${tx.reference_number} • ${tx.payment_channel}</div>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-6">
            <div class="text-left sm:text-right">
              <div class="font-bold font-mono text-sm text-slate-900 dark:text-white">$${tx.sender_amount.toLocaleString()} ${tx.sender_currency}</div>
              <div class="text-[11px] text-slate-400">${tx.date}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}">${tx.status}</span>
              <button onclick="event.stopPropagation(); app.showDigitalReceipt('${tx.id}')" class="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100" title="View Receipt">
                <i data-lucide="receipt" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (window.lucide) lucide.createIcons();
  }

  // =========================================================================
  // SEND MONEY WIZARD LOGIC
  // =========================================================================
  renderSendBeneficiaries() {
    const container = document.getElementById('send-beneficiaries-list');
    if (!container) return;

    if (!this.activeSendBeneficiary && this.beneficiaries.length > 0) {
      this.activeSendBeneficiary = this.beneficiaries[0];
    }

    container.innerHTML = this.beneficiaries.map(b => {
      const isSelected = this.activeSendBeneficiary && this.activeSendBeneficiary.id === b.id;
      const meta = this.currencies[b.currency_code] || {};

      return `
        <div onclick="app.selectSendBeneficiary('${b.id}')" class="p-4 rounded-2xl border-2 ${isSelected ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'} transition cursor-pointer flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${meta.flag}</span>
            <div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">${b.full_name}</div>
              <div class="text-xs text-slate-400">${b.bank_name} • ${b.account_identifier}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${b.currency_code}</span>
            <input type="radio" name="send_beneficiary_radio" ${isSelected ? 'checked' : ''} class="text-brand-600">
          </div>
        </div>
      `;
    }).join('');
  }

  selectSendBeneficiary(id) {
    this.activeSendBeneficiary = this.beneficiaries.find(b => b.id === id);
    this.renderSendBeneficiaries();
    this.recalculateSendQuote();
  }

  setSendStep(stepNum) {
    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`send-step-${i}`);
      const numEl = document.getElementById(`step-num-${i}`);
      if (stepEl) {
        if (i === stepNum) {
          stepEl.classList.remove('hidden');
          if (numEl) {
            numEl.classList.add('bg-brand-600', 'text-white');
            numEl.classList.remove('bg-slate-200', 'text-slate-500');
          }
        } else {
          stepEl.classList.add('hidden');
          if (numEl && i > stepNum) {
            numEl.classList.remove('bg-brand-600', 'text-white');
            numEl.classList.add('bg-slate-200', 'text-slate-500');
          }
        }
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  proceedToSendStep2() {
    if (!this.activeSendBeneficiary) {
      this.showToast('Please select a recipient first', 'warning');
      return;
    }
    const b = this.activeSendBeneficiary;
    const meta = this.currencies[b.currency_code] || {};

    const nameEl = document.getElementById('send-step2-name');
    const detailsEl = document.getElementById('send-step2-details');
    const flagEl = document.getElementById('send-step2-flag');
    const recipFlag = document.getElementById('send-recipient-flag');
    const recipCurr = document.getElementById('send-recipient-curr');

    if (nameEl) nameEl.innerText = b.full_name;
    if (detailsEl) detailsEl.innerText = `${b.bank_name} • ${b.account_identifier}`;
    if (flagEl) flagEl.innerText = meta.flag || '🌐';
    if (recipFlag) recipFlag.innerText = meta.flag || '🌐';
    if (recipCurr) recipCurr.innerText = b.currency_code;

    this.recalculateSendQuote();
    this.setSendStep(2);
  }

  recalculateSendQuote() {
    const amount = parseFloat(document.getElementById('send-input-amount')?.value) || 0;
    const senderCurr = document.getElementById('send-sender-curr')?.value || 'USD';
    const targetCurr = this.activeSendBeneficiary ? this.activeSendBeneficiary.currency_code : 'INR';

    // Calculate cross rate
    const usdToSender = this.fxRates[senderCurr] || 1.0;
    const usdToTarget = this.fxRates[targetCurr] || 83.425;
    const midRate = usdToTarget / usdToSender;
    const effectiveRate = midRate * (1 - 0.0035); // 0.35% transparent markup
    const fee = 0.99;
    const netConvert = Math.max(0, amount - fee);
    const recipientAmount = (netConvert * effectiveRate).toFixed(targetCurr === 'JPY' ? 0 : 2);

    this.activeSendQuote = {
      sender_currency: senderCurr,
      sender_amount: amount,
      target_currency: targetCurr,
      effective_rate: effectiveRate,
      fee: fee,
      recipient_amount: recipientAmount,
      arrival: "Instant (~5 minutes via Faster Express)"
    };

    const rateDisplay = document.getElementById('send-quote-rate');
    const feeDisplay = document.getElementById('send-quote-fee');
    const recipAmountInput = document.getElementById('send-recipient-amount');

    if (rateDisplay) rateDisplay.innerText = `1 ${senderCurr} = ${effectiveRate.toFixed(4)} ${targetCurr}`;
    if (feeDisplay) feeDisplay.innerText = `$${fee.toFixed(2)} USD`;
    if (recipAmountInput) recipAmountInput.value = recipientAmount;

    // Update review step elements
    const revSend = document.getElementById('review-send-amount');
    const revRate = document.getElementById('review-rate');
    const revFee = document.getElementById('review-fee');
    const revRecip = document.getElementById('review-recipient');
    const revRecipAmount = document.getElementById('review-recipient-amount');

    if (revSend) revSend.innerText = `$${amount.toFixed(2)} ${senderCurr}`;
    if (revRate) revRate.innerText = `1 ${senderCurr} = ${effectiveRate.toFixed(4)} ${targetCurr}`;
    if (revFee) revFee.innerText = `$${fee.toFixed(2)} ${senderCurr}`;
    if (revRecip) revRecip.innerText = this.activeSendBeneficiary ? `${this.activeSendBeneficiary.full_name} (${this.activeSendBeneficiary.bank_name})` : 'Recipient';
    if (revRecipAmount) revRecipAmount.innerText = `${recipientAmount} ${targetCurr}`;
  }

  executeSendMoneyTransfer() {
    const code = document.getElementById('send-2fa-input')?.value.trim();
    if (!code || code !== '123456') {
      this.showToast('Invalid 2FA code. For demo, use 123456.', 'error');
      return;
    }

    const q = this.activeSendQuote;
    const b = this.activeSendBeneficiary;
    const ref = `GP-${new Date().toISOString().slice(0,7).replace('-','')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

    // Deduct wallet balance
    const wallet = this.wallets.find(w => w.code === q.sender_currency);
    if (wallet) {
      if (wallet.balance < q.sender_amount) {
        this.showToast(`Insufficient ${q.sender_currency} balance. Please deposit funds or choose a debit card.`, 'error');
        return;
      }
      wallet.balance -= q.sender_amount;
    }

    const newTx = {
      id: `tx_${Date.now()}`,
      reference_number: ref,
      transaction_type: "SEND_MONEY",
      sender_currency: q.sender_currency,
      sender_amount: q.sender_amount,
      exchange_rate: q.effective_rate,
      transfer_fee: q.fee,
      total_charged: q.sender_amount,
      recipient_currency: q.target_currency,
      recipient_amount: parseFloat(q.recipient_amount),
      beneficiary_name: b.full_name,
      payment_channel: `Faster Rails (${q.target_currency})`,
      status: "COMPLETED",
      date: "Just now",
      purpose: "Family Maintenance / Remittance",
      payment_method: `${q.sender_currency} Wallet Balance`
    };

    this.transactions.unshift(newTx);
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: "Transfer Sent Successfully",
      message: `Sent ${q.sender_amount} ${q.sender_currency} to ${b.full_name}. Ref: ${ref}.`,
      category: "TRANSFER",
      is_read: false,
      time: "Just now"
    });

    this.activeReceiptData = newTx;

    // Update success screen
    const refEl = document.getElementById('success-ref');
    const headlineEl = document.getElementById('success-headline');
    const subtextEl = document.getElementById('success-subtext');

    if (refEl) refEl.innerText = ref;
    if (headlineEl) headlineEl.innerText = "Funds are on the way!";
    if (subtextEl) subtextEl.innerText = `Sent $${q.sender_amount.toFixed(2)} ${q.sender_currency} (${q.recipient_amount} ${q.target_currency}) to ${b.full_name}`;

    this.setSendStep(5);
    this.renderAll();
    this.showToast('Transfer completed successfully!', 'success');
  }

  // Quick send from avatar
  quickSendTo(benId) {
    this.activeSendBeneficiary = this.beneficiaries.find(b => b.id === benId);
    this.navigateTo('send');
    this.proceedToSendStep2();
  }

  // Receive Money Screen & Dynamic QR Code
  renderReceiveScreen() {
    const container = document.getElementById('receive-currency-selector');
    if (!container) return;

    const activeCurr = this.activeReceiveCurr || 'USD';
    container.innerHTML = Object.keys(this.currencies).map(code => {
      const meta = this.currencies[code];
      const isSel = code === activeCurr;
      return `
        <button onclick="app.setReceiveCurrency('${code}')" class="px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${isSel ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
          <span>${meta.flag}</span>
          <span>${code}</span>
        </button>
      `;
    }).join('');

    const meta = this.currencies[activeCurr];
    const wallet = this.wallets.find(w => w.code === activeCurr) || this.wallets[0];

    const acctNum = document.getElementById('receive-acct-num');
    const routingNum = document.getElementById('receive-routing-num');
    const bankName = document.getElementById('receive-bank-name');

    if (acctNum) acctNum.innerText = wallet.account;
    if (routingNum) routingNum.innerText = wallet.routing;
    if (bankName) bankName.innerText = meta.bank;

    // Generate dynamic QR Code
    const qrContainer = document.getElementById('receive-qrcode-container');
    if (qrContainer && window.QRCode) {
      qrContainer.innerHTML = '';
      const paymentUri = `globalpay://pay?currency=${activeCurr}&account=${wallet.account}&routing=${wallet.routing}&beneficiary=Harshit+Malhi`;
      new QRCode(qrContainer, {
        text: paymentUri,
        width: 140,
        height: 140,
        colorDark: "#1E1B4B",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  setReceiveCurrency(code) {
    this.activeReceiveCurr = code;
    this.renderReceiveScreen();
  }

  // Currency Converter Screen & Trend Chart
  calculateConverter() {
    const amount = parseFloat(document.getElementById('converter-amount')?.value) || 0;
    const from = document.getElementById('converter-from-curr')?.value || 'USD';
    const to = document.getElementById('converter-to-curr')?.value || 'INR';

    const usdToFrom = this.fxRates[from] || 1.0;
    const usdToTo = this.fxRates[to] || 83.42;
    const rate = usdToTo / usdToFrom;
    const result = (amount * rate).toFixed(to === 'JPY' ? 0 : 2);

    const resultEl = document.getElementById('converter-result');
    const badgeEl = document.getElementById('converter-rate-badge');

    if (resultEl) resultEl.value = result;
    if (badgeEl) badgeEl.innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;

    this.renderPopularConverterPairs(from);
  }

  swapConverterCurrencies() {
    const fromEl = document.getElementById('converter-from-curr');
    const toEl = document.getElementById('converter-to-curr');
    if (fromEl && toEl) {
      const temp = fromEl.value;
      fromEl.value = toEl.value;
      toEl.value = temp;
      this.calculateConverter();
      this.renderFXChart();
    }
  }

  renderPopularConverterPairs(base) {
    const container = document.getElementById('converter-popular-pairs');
    if (!container) return;

    const list = ['EUR', 'GBP', 'INR', 'CAD', 'JPY'].filter(c => c !== base);
    container.innerHTML = list.map(code => {
      const meta = this.currencies[code];
      const usdToBase = this.fxRates[base] || 1.0;
      const usdToCode = this.fxRates[code] || 1.0;
      const cross = (usdToCode / usdToBase).toFixed(4);

      return `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">${meta.flag}</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">${base} to ${code}</span>
          </div>
          <span class="font-bold font-mono text-slate-900 dark:text-white">${cross}</span>
        </div>
      `;
    }).join('');
  }

  renderFXChart() {
    const canvas = document.getElementById('fx-trend-chart');
    if (!canvas) return;

    const from = document.getElementById('converter-from-curr')?.value || 'USD';
    const to = document.getElementById('converter-to-curr')?.value || 'INR';
    const baseRate = (this.fxRates[to] || 83.42) / (this.fxRates[from] || 1.0);

    const labels = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
    const data = [
      baseRate * 0.992,
      baseRate * 0.995,
      baseRate * 0.993,
      baseRate * 0.997,
      baseRate * 0.999,
      baseRate * 1.001,
      baseRate
    ];

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${from}/${to} Exchange Rate`,
          data: data,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  prefillSendFromConverter() {
    this.navigateTo('send');
    this.proceedToSendStep2();
  }

  // =========================================================================
  // TRANSACTION DETAILS & DIGITAL RECEIPT
  // =========================================================================
  showTransactionDetails(txId) {
    const tx = this.transactions.find(t => t.id === txId) || this.transactions[0];
    this.activeReceiptData = tx;

    const refEl = document.getElementById('td-ref');
    const titleEl = document.getElementById('td-title');
    const sentEl = document.getElementById('td-sent-amount');
    const rateEl = document.getElementById('td-exchange-rate');
    const feeEl = document.getElementById('td-fee');
    const delivEl = document.getElementById('td-delivered-amount');

    if (refEl) refEl.innerText = tx.reference_number;
    if (titleEl) titleEl.innerText = `Transfer to ${tx.beneficiary_name}`;
    if (sentEl) sentEl.innerText = `$${tx.sender_amount.toLocaleString()} ${tx.sender_currency}`;
    if (rateEl) rateEl.innerText = `1 ${tx.sender_currency} = ${tx.exchange_rate.toFixed(4)} ${tx.recipient_currency}`;
    if (feeEl) feeEl.innerText = `$${tx.transfer_fee.toFixed(2)} USD`;
    if (delivEl) delivEl.innerText = `${tx.recipient_amount.toLocaleString()} ${tx.recipient_currency}`;

    this.navigateTo('details');
  }

  showDigitalReceipt(txId) {
    const tx = this.transactions.find(t => t.id === txId) || this.transactions[0];
    this.activeReceiptData = tx;
    this.populateReceiptUI(tx);
    this.navigateTo('receipt');
  }

  viewActiveReceipt() {
    if (this.activeReceiptData) {
      this.populateReceiptUI(this.activeReceiptData);
      this.navigateTo('receipt');
    }
  }

  populateReceiptUI(tx) {
    const recNum = document.getElementById('receipt-rec-num');
    const date = document.getElementById('receipt-date');
    const ben = document.getElementById('receipt-beneficiary');
    const bank = document.getElementById('receipt-bank-channel');
    const dest = document.getElementById('receipt-dest-country');
    const sent = document.getElementById('receipt-sender-amount');
    const fee = document.getElementById('receipt-fee');
    const rate = document.getElementById('receipt-exchange-rate');
    const recip = document.getElementById('receipt-recipient-amount');
    const hash = document.getElementById('receipt-hash');

    if (recNum) recNum.innerText = `REC-${tx.reference_number}`;
    if (date) date.innerText = `${tx.date}`;
    if (ben) ben.innerText = tx.beneficiary_name;
    if (bank) bank.innerText = tx.payment_channel;
    if (dest) dest.innerText = this.currencies[tx.recipient_currency]?.country || 'International';
    if (sent) sent.innerText = `$${tx.sender_amount.toLocaleString()} ${tx.sender_currency}`;
    if (fee) fee.innerText = `$${tx.transfer_fee.toFixed(2)} USD`;
    if (rate) rate.innerText = `1 ${tx.sender_currency} = ${tx.exchange_rate.toFixed(4)} ${tx.recipient_currency}`;
    if (recip) recip.innerText = `${tx.recipient_amount.toLocaleString()} ${tx.recipient_currency}`;
    if (hash) hash.innerText = `0x${Math.random().toString(16).substring(2, 14).toUpperCase()}${Math.random().toString(16).substring(2, 14).toUpperCase()}`;
  }

  shareReceiptViaEmail() {
    this.showToast('Digital receipt sent to your registered email address!', 'success');
  }

  // =========================================================================
  // ONBOARDING TOUR
  // =========================================================================
  renderOnboardingSlide() {
    const container = document.getElementById('onboarding-slide-content');
    if (!container) return;

    const slides = [
      {
        icon: "globe",
        title: "Borderless Transfers Worldwide",
        sub: "Send money to 180+ countries across 9 supported native currencies with instant settlement."
      },
      {
        icon: "percent",
        title: "Zero Hidden Markups",
        sub: "We use the real mid-market exchange rate, exactly as seen on financial feeds, saving up to 8x vs banks."
      },
      {
        icon: "shield-check",
        title: "Bank-Grade Financial Security",
        sub: "Regulated, 2FA enabled, 256-bit TLS encrypted, and fully compliant with international AML standards."
      }
    ];

    const slide = slides[this.onboardingStep - 1] || slides[0];

    container.innerHTML = `
      <div class="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 mx-auto flex items-center justify-center mb-6">
        <i data-lucide="${slide.icon}" class="w-8 h-8"></i>
      </div>
      <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">${slide.title}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">${slide.sub}</p>
    `;

    // Update dots
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById(`onboard-dot-${i}`);
      if (dot) {
        if (i === this.onboardingStep) {
          dot.className = "w-8 h-2 rounded-full bg-brand-600 transition-all";
        } else {
          dot.className = "w-2.5 h-2 rounded-full bg-slate-300 dark:bg-slate-700 transition-all";
        }
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  nextOnboardingSlide() {
    if (this.onboardingStep < 3) {
      this.onboardingStep++;
      this.renderOnboardingSlide();
    } else {
      this.navigateTo('login');
    }
  }

  prevOnboardingSlide() {
    if (this.onboardingStep > 1) {
      this.onboardingStep--;
      this.renderOnboardingSlide();
    }
  }

  // =========================================================================
  // ADMIN PORTAL & COMPLIANCE REVIEW
  // =========================================================================
  renderAdminScreen() {
    this.renderAdminKYCQueue();
    this.renderAdminUsersList();
    this.renderAdminRiskAlerts();
  }

  renderAdminKYCQueue() {
    const container = document.getElementById('admin-kyc-queue-cards');
    if (!container) return;

    if (this.adminKycQueue.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">All submissions reviewed. Queue is clear!</div>`;
      return;
    }

    container.innerHTML = this.adminKycQueue.map(item => {
      return `
        <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div class="font-bold text-slate-900 dark:text-white text-sm">${item.user_name}</div>
            <div class="text-slate-400">${item.user_email} • ${item.country} • ${item.doc_type} (#${item.doc_num})</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1">Automated Risk Score: ${item.risk} (Low)</div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="app.adminDecisionKYC('${item.id}', 'APPROVE')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Approve Tier 2
            </button>
            <button onclick="app.adminDecisionKYC('${item.id}', 'REJECT')" class="border border-rose-300 dark:border-rose-900 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl font-bold">
              Reject
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  adminDecisionKYC(id, decision) {
    this.adminKycQueue = this.adminKycQueue.filter(k => k.id !== id);
    const kycCount = document.getElementById('admin-kpi-kyc');
    if (kycCount) kycCount.innerText = `${this.adminKycQueue.length} Submissions`;

    this.renderAdminKYCQueue();
    this.showToast(`Submission marked as ${decision}`, decision === 'APPROVE' ? 'success' : 'warning');
  }

  renderAdminUsersList() {
    const container = document.getElementById('admin-users-table');
    if (!container) return;

    const mockUsers = [
      { name: "Harshit Malhi", email: "harshit@globalpay.io", tier: "Tier 2", balance: "$24,842.15", status: "Active" },
      { name: "Eleanor Vance", email: "eleanor.v@techpartners.co.uk", tier: "Tier 3", balance: "$85,210.00", status: "Active" },
      { name: "Kenji Takahashi", email: "kenji.t@venturejapan.jp", tier: "Tier 2", balance: "$12,400.00", status: "Active" }
    ];

    container.innerHTML = mockUsers.map(u => `
      <div class="py-3 flex items-center justify-between text-xs">
        <div>
          <div class="font-bold text-slate-800 dark:text-white">${u.name}</div>
          <div class="text-slate-400 text-[11px]">${u.email}</div>
        </div>
        <div class="flex items-center gap-4">
          <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${u.balance}</span>
          <span class="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">${u.tier}</span>
        </div>
      </div>
    `).join('');
  }

  renderAdminRiskAlerts() {
    const container = document.getElementById('admin-risk-alerts-list');
    if (!container) return;

    container.innerHTML = this.adminRiskAlerts.map(ra => `
      <div class="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[10px]">${ra.title} (${ra.severity})</span>
          <span class="text-slate-400 text-[10px]">${ra.time}</span>
        </div>
        <p class="text-slate-600 dark:text-slate-300">${ra.desc}</p>
      </div>
    `).join('');
  }

  setAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.add('hidden'));
    const pane = document.getElementById(`admin-tab-${tabName}`);
    if (pane) pane.classList.remove('hidden');

    ['kyc', 'users', 'risk', 'fees'].forEach(t => {
      const btn = document.getElementById(`admin-tab-${t}-btn`);
      if (btn) {
        if (t === tabName) {
          btn.className = "text-brand-600 border-b-2 border-brand-600 pb-2";
        } else {
          btn.className = "text-slate-400 hover:text-slate-700 pb-2";
        }
      }
    });
  }

  updateAdminFees() {
    const markup = document.getElementById('admin-fee-markup-input')?.value;
    const base = document.getElementById('admin-fee-base-input')?.value;
    const kpiMarkup = document.getElementById('admin-kpi-markup');
    if (kpiMarkup) kpiMarkup.innerText = `${markup}%`;
    this.showToast(`Updated platform markup to ${markup}% & base fee to $${base}`, 'success');
  }

  toggleAdminMode() {
    this.isAdminMode = !this.isAdminMode;
    const btn = document.getElementById('role-toggle-label');
    if (this.isAdminMode) {
      if (btn) btn.innerText = "User View";
      this.navigateTo('admin');
    } else {
      if (btn) btn.innerText = "Admin Mode";
      this.navigateTo('dashboard');
    }
  }

  // =========================================================================
  // NOTIFICATIONS, SESSIONS & SECURITY
  // =========================================================================
  renderNotificationsList() {
    const container = document.getElementById('notif-list-container');
    const fullContainer = document.getElementById('full-notifications-list');

    const markup = this.notifications.map(n => `
      <div onclick="app.showNotificationAction('${n.id}')" class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs ${n.is_read ? 'opacity-70' : 'bg-indigo-50/30'}">
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-slate-800 dark:text-white">${n.title}</span>
          <span class="text-[10px] text-slate-400">${n.time}</span>
        </div>
        <p class="text-slate-500 text-[11px]">${n.message}</p>
      </div>
    `).join('');

    if (container) container.innerHTML = markup;
    if (fullContainer) fullContainer.innerHTML = markup;

    const unread = this.notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    const countText = document.getElementById('notif-count-text');

    if (badge) badge.style.display = unread > 0 ? 'block' : 'none';
    if (countText) countText.innerText = `${unread} new`;
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => n.is_read = true);
    this.renderNotificationsList();
    this.showToast('All notifications marked as read', 'info');
  }

  toggleNotificationsDrawer() {
    const el = document.getElementById('notifications-dropdown');
    if (el) el.classList.toggle('hidden');
  }

  toggleUserMenu() {
    const el = document.getElementById('user-menu-dropdown');
    if (el) el.classList.toggle('hidden');
  }

  renderSecuritySessions() {
    const container = document.getElementById('security-sessions-list');
    if (!container) return;

    const sessions = [
      { id: "s1", device: "Chrome on Windows 11 (Current Session)", ip: "198.51.100.24", location: "San Francisco, USA", current: true },
      { id: "s2", device: "GlobalPay Mobile App (iPhone 15 Pro)", ip: "172.56.21.90", location: "San Francisco, USA", current: false }
    ];

    container.innerHTML = sessions.map(s => `
      <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <div class="font-bold text-slate-800 dark:text-white">${s.device}</div>
          <div class="text-[11px] text-slate-400">${s.ip} • ${s.location}</div>
        </div>
        ${s.current ? '<span class="text-emerald-600 font-bold">This Device</span>' : '<button onclick="app.revokeSession(this)" class="text-rose-600 font-bold hover:underline">Revoke</button>'}
      </div>
    `).join('');
  }

  revokeSession(btn) {
    btn.parentElement.remove();
    this.showToast('Device session revoked successfully', 'info');
  }

  renderSecurityAuditLogs() {
    const container = document.getElementById('security-audit-list');
    if (!container) return;

    const logs = [
      { event: "2FA TOTP Verified", time: "10 mins ago", ip: "198.51.100.24" },
      { event: "Transfer $500 USD Authorized", time: "1 hour ago", ip: "198.51.100.24" },
      { event: "Password Verified", time: "3 days ago", ip: "198.51.100.24" }
    ];

    container.innerHTML = logs.map(l => `
      <div class="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span class="font-semibold text-slate-800 dark:text-slate-200">${l.event}</span>
          <span class="text-[10px] text-slate-400 block font-mono">IP: ${l.ip}</span>
        </div>
        <span class="text-slate-400 text-[11px]">${l.time}</span>
      </div>
    `).join('');
  }

  toggle2FA() {
    this.user.twoFactorEnabled = !this.user.twoFactorEnabled;
    const btn = document.getElementById('btn-toggle-2fa');
    if (btn) {
      btn.innerText = this.user.twoFactorEnabled ? "Enabled (TOTP)" : "Disabled";
      btn.className = this.user.twoFactorEnabled ? "bg-brand-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm" : "bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl";
    }
    this.showToast(`Two-Factor Authentication ${this.user.twoFactorEnabled ? 'Enabled' : 'Disabled'}`, 'info');
  }

  // =========================================================================
  // SUPPORT LIVE AI CHAT
  // =========================================================================
  handleSupportChat(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const msg = input?.value.trim();
    if (!msg) return;

    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    // User message
    container.innerHTML += `
      <div class="flex justify-end gap-2">
        <div class="bg-brand-600 text-white p-3 rounded-2xl rounded-tr-none max-w-sm">
          ${msg}
        </div>
      </div>
    `;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Simulated Smart Reply
    setTimeout(() => {
      let reply = "I can help with that! Transfers to India, Europe, and the UK arrive in under 5 minutes with zero hidden markups.";
      if (msg.toLowerCase().includes('fee') || msg.toLowerCase().includes('cost')) {
        reply = "Our fees start from just $0.99 with a flat 0.35% mid-market spread. You save about 85% compared to high-street banks!";
      } else if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('tier')) {
        reply = "Your account is Tier 2 Verified with a $25,000 USD daily limit. You can request Tier 3 for unlimited transfers in KYC settings.";
      }

      container.innerHTML += `
        <div class="flex gap-2">
          <div class="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">GP</div>
          <div class="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none max-w-sm">
            ${reply}
          </div>
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    }, 600);
  }

  // =========================================================================
  // MODALS & HELPERS
  // =========================================================================
  openAddBeneficiaryModal() {
    const m = document.getElementById('modal-add-beneficiary');
    if (m) m.classList.remove('hidden');
  }

  closeAddBeneficiaryModal() {
    const m = document.getElementById('modal-add-beneficiary');
    if (m) m.classList.add('hidden');
  }

  handleAddBeneficiarySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('ben-name')?.value;
    const country = document.getElementById('ben-country')?.value;
    const currency = document.getElementById('ben-currency')?.value;
    const bank = document.getElementById('ben-bank')?.value;
    const acct = document.getElementById('ben-acct')?.value;
    const type = document.getElementById('ben-type')?.value;

    const newBen = {
      id: `ben_${Date.now()}`,
      full_name: name,
      nickname: name.split(' ')[0],
      country_code: country,
      currency_code: currency,
      bank_name: bank,
      account_identifier_type: type,
      account_identifier: acct,
      is_favorite: false,
      relationship: "Beneficiary"
    };

    this.beneficiaries.unshift(newBen);
    this.closeAddBeneficiaryModal();
    this.renderBeneficiariesList();
    this.renderQuickBeneficiaries();
    this.renderSendBeneficiaries();
    this.showToast(`Beneficiary ${name} added successfully!`, 'success');
  }

  deleteBeneficiary(id) {
    this.beneficiaries = this.beneficiaries.filter(b => b.id !== id);
    this.renderBeneficiariesList();
    this.renderQuickBeneficiaries();
    this.renderSendBeneficiaries();
    this.showToast('Beneficiary removed', 'info');
  }

  toggleFavoriteBeneficiary(id) {
    const b = this.beneficiaries.find(item => item.id === id);
    if (b) {
      b.is_favorite = !b.is_favorite;
      this.renderBeneficiariesList();
    }
  }

  openConvertModal() {
    const m = document.getElementById('modal-convert');
    if (m) {
      m.classList.remove('hidden');
      this.updateModalConvertQuote();
    }
  }

  closeConvertModal() {
    const m = document.getElementById('modal-convert');
    if (m) m.classList.add('hidden');
  }

  updateModalConvertQuote() {
    const from = document.getElementById('modal-convert-from')?.value || 'USD';
    const to = document.getElementById('modal-convert-to')?.value || 'EUR';
    const amt = parseFloat(document.getElementById('modal-convert-amount')?.value) || 0;

    const rate = (this.fxRates[to] || 1.0) / (this.fxRates[from] || 1.0);
    const receive = (amt * rate).toFixed(2);

    const rateEl = document.getElementById('modal-convert-rate');
    const recEl = document.getElementById('modal-convert-receive');

    if (rateEl) rateEl.innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    if (recEl) recEl.innerText = `${receive} ${to}`;
  }

  executeWalletConversion() {
    const from = document.getElementById('modal-convert-from')?.value || 'USD';
    const to = document.getElementById('modal-convert-to')?.value || 'EUR';
    const amt = parseFloat(document.getElementById('modal-convert-amount')?.value) || 0;

    const wFrom = this.wallets.find(w => w.code === from);
    const wTo = this.wallets.find(w => w.code === to);

    if (wFrom.balance < amt) {
      this.showToast(`Insufficient ${from} balance`, 'error');
      return;
    }

    const rate = (this.fxRates[to] || 1.0) / (this.fxRates[from] || 1.0);
    const receive = amt * rate;

    wFrom.balance -= amt;
    wTo.balance += receive;

    this.closeConvertModal();
    this.renderAll();
    this.showToast(`Converted ${amt} ${from} to ${receive.toFixed(2)} ${to}`, 'success');
  }

  // Add Money (Deposit) Submit
  handleAddMoneySubmit(e) {
    e.preventDefault();
    const curr = document.getElementById('deposit-currency')?.value || 'USD';
    const amt = parseFloat(document.getElementById('deposit-amount')?.value) || 0;
    const method = document.getElementById('deposit-method')?.value || 'ACH';

    const wallet = this.wallets.find(w => w.code === curr);
    if (wallet) {
      wallet.balance += amt;
    }

    this.transactions.unshift({
      id: `tx_${Date.now()}`,
      reference_number: `GP-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      transaction_type: "ADD_MONEY",
      sender_currency: curr,
      sender_amount: amt,
      exchange_rate: 1.0,
      transfer_fee: 0.0,
      total_charged: amt,
      recipient_currency: curr,
      recipient_amount: amt,
      beneficiary_name: `Deposit to ${curr} Wallet`,
      payment_channel: method,
      status: "COMPLETED",
      date: "Just now",
      purpose: "Wallet Funding",
      payment_method: method
    });

    this.renderAll();
    this.navigateTo('dashboard');
    this.showToast(`Successfully deposited ${amt} ${curr} into your wallet!`, 'success');
  }

  depositToCurrency(code) {
    this.navigateTo('add_money');
    const el = document.getElementById('deposit-currency');
    if (el) el.value = code;
  }

  sendFromCurrency(code) {
    this.navigateTo('send');
    const el = document.getElementById('send-sender-curr');
    if (el) el.value = code;
    this.recalculateSendQuote();
  }

  // Auth & OTP Simulations
  handleLoginSubmit(e) {
    e.preventDefault();
    this.navigateTo('otp');
    this.showToast('One-Time Password challenge sent!', 'info');
  }

  handleSignupSubmit(e) {
    e.preventDefault();
    this.navigateTo('otp');
    this.showToast('Account created! Enter your verification code.', 'success');
  }

  fillDemoLogin() {
    const id = document.getElementById('login-identifier');
    if (id) id.value = 'harshit@globalpay.io';
    this.showToast('Demo credentials pre-filled', 'info');
  }

  fillDemoOTP() {
    const digits = ['1', '2', '3', '4', '5', '6'];
    document.querySelectorAll('.otp-input').forEach((input, i) => {
      input.value = digits[i];
    });
    this.showToast('Pre-filled code: 123456', 'info');
  }

  fill2FADemo() {
    const el = document.getElementById('send-2fa-input');
    if (el) el.value = '123456';
    this.showToast('2FA code filled: 123456', 'info');
  }

  submitOTPVerification() {
    this.navigateTo('dashboard');
    this.showToast('Identity authenticated successfully!', 'success');
  }

  socialLogin(provider) {
    this.navigateTo('dashboard');
    this.showToast(`Signed in securely via ${provider} OAuth Sandbox`, 'success');
  }

  showForgotPasswordAlert() {
    alert("Password reset instructions sent to your registered email address.");
  }

  // Theme & Clipboard Helpers
  toggleTheme() {
    document.documentElement.classList.toggle('dark');
    this.showToast(`Theme switched`, 'info');
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast(`Copied "${text}" to clipboard`, 'success');
    }
  }

  sharePaymentLink() {
    this.copyToClipboard("https://globalpay.me/pay/harshitmalhi");
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-indigo-600 text-white'
    };

    const toast = document.createElement('div');
    toast.className = `${colors[type]} px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transition-all transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  exportTransactionsCSV() {
    const headers = "Reference,Date,Type,Amount,Currency,Recipient,Status\n";
    const rows = this.transactions.map(t => `"${t.reference_number}","${t.date}","${t.transaction_type}","${t.sender_amount}","${t.sender_currency}","${t.beneficiary_name}","${t.status}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GlobalPay_Statement_${Date.now()}.csv`;
    a.click();
    this.showToast("Transactions CSV downloaded", "success");
  }

  resetDemoData() {
    location.reload();
  }

  setupListeners() {
    // Auto-advance OTP inputs
    document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('main-sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
      });
    }
  }
}

// Global App Instance
window.app = new GlobalPayApp();
