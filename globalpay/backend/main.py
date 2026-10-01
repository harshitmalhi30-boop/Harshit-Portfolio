"""
GlobalPay - Backend Server & API
FastAPI application providing full RESTful APIs for cross-border money transfers,
multi-currency wallets, live FX rates, KYC verification, security auditing, and administration.
"""

import os
import uuid
import time
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

try:
    from fx_service import fx_engine, CURRENCY_METADATA
except ImportError:
    from backend.fx_service import fx_engine, CURRENCY_METADATA

app = FastAPI(
    title="GlobalPay API",
    description="Cross-border payment platform - Send Money Anywhere, Anytime",
    version="1.0.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# IN-MEMORY DATABASE & SEED STATE
# Allows immediate interactive operation without complex database setup,
# while adhering to the PostgreSQL schema design.
# -----------------------------------------------------------------------------

def generate_ref() -> str:
    return f"GP-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

def get_current_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class DataStore:
    def __init__(self):
        self.reset_all()

    def reset_all(self):
        # Current user profile
        self.user = {
            "id": "usr_998144a1",
            "email": "harshit@globalpay.io",
            "phone_number": "+1 (555) 234-5678",
            "role": "USER",
            "account_status": "ACTIVE",
            "two_factor_enabled": True,
            "two_factor_type": "TOTP",
            "profile": {
                "first_name": "Harshit",
                "last_name": "Malhi",
                "date_of_birth": "1998-05-14",
                "nationality": "USA",
                "country_of_residence": "USA",
                "street_address": "742 Evergreen Terrace",
                "city": "San Francisco",
                "state_province": "California",
                "postal_code": "94107",
                "preferred_currency": "USD",
                "tier_level": 2,
                "tier_name": "Verified Account",
                "daily_limit_usd": 25000.0,
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
            }
        }

        # Multi-currency wallets
        self.wallets = {
            "USD": {"code": "USD", "balance": 14850.50, "account_number": "489201948102", "routing_number": "121000358", "type": "ACH Checking"},
            "EUR": {"code": "EUR", "balance": 4210.00, "account_number": "DE89370400440532013000", "routing_number": "DBEUT38XXX", "type": "Virtual SEPA IBAN"},
            "GBP": {"code": "GBP", "balance": 2850.25, "account_number": "90812345", "routing_number": "20-00-00", "type": "UK Faster Payments"},
            "INR": {"code": "INR", "balance": 125000.00, "account_number": "919876543210", "routing_number": "HDFC0001234", "type": "UPI / NEFT Local"},
            "CAD": {"code": "CAD", "balance": 3100.00, "account_number": "88710294", "routing_number": "0001-12345", "type": "Interac / EFT"},
            "AUD": {"code": "AUD", "balance": 1950.00, "account_number": "123-456 98765432", "routing_number": "BSB 082-001", "type": "PayID / NPP"},
            "AED": {"code": "AED", "balance": 8400.00, "account_number": "AE070331234567890123456", "routing_number": "EIBUAE2D", "type": "UAE Local Routing"},
            "SGD": {"code": "SGD", "balance": 2400.00, "account_number": "7171-081-998877", "routing_number": "DBSSSGSG", "type": "FAST / PayNow"},
            "JPY": {"code": "JPY", "balance": 380000.00, "account_number": "1234567", "routing_number": "0005-012", "type": "Zengin Direct"}
        }

        # Beneficiaries
        self.beneficiaries = [
            {
                "id": "ben_1",
                "full_name": "Eleanor Vance",
                "nickname": "Eleanor (UK)",
                "email": "eleanor.v@techpartners.co.uk",
                "country_code": "GBR",
                "currency_code": "GBP",
                "bank_name": "Barclays Bank UK",
                "account_identifier_type": "ACCOUNT_NUMBER",
                "account_identifier": "89201940",
                "routing_code": "20-04-15",
                "relationship": "Business Partner",
                "is_favorite": True
            },
            {
                "id": "ben_2",
                "full_name": "Aarav Sharma",
                "nickname": "Aarav (Family)",
                "email": "aarav.sharma@gmail.com",
                "country_code": "IND",
                "currency_code": "INR",
                "bank_name": "HDFC Bank",
                "account_identifier_type": "UPI_ID",
                "account_identifier": "aarav.sharma@okhdfcbank",
                "routing_code": "HDFC0000240",
                "relationship": "Family Member",
                "is_favorite": True
            },
            {
                "id": "ben_3",
                "full_name": "Markus Weber",
                "nickname": "Markus (Munich)",
                "email": "m.weber@designstudio.de",
                "country_code": "DEU",
                "currency_code": "EUR",
                "bank_name": "Deutsche Bank Frankfurt",
                "account_identifier_type": "IBAN",
                "account_identifier": "DE44500700100987654321",
                "routing_code": "DEUTDEDDFXX",
                "relationship": "Consultant",
                "is_favorite": False
            },
            {
                "id": "ben_4",
                "full_name": "Kenji Takahashi",
                "nickname": "Kenji (Tokyo)",
                "email": "kenji.t@venturejapan.jp",
                "country_code": "JPN",
                "currency_code": "JPY",
                "bank_name": "Mitsubishi UFJ Bank",
                "account_identifier_type": "ACCOUNT_NUMBER",
                "account_identifier": "7810293",
                "routing_code": "MUFGJPJT",
                "relationship": "Contractor",
                "is_favorite": False
            },
            {
                "id": "ben_5",
                "full_name": "Sophie Tremblay",
                "nickname": "Sophie (Montreal)",
                "email": "sophie.t@creatives.ca",
                "country_code": "CAN",
                "currency_code": "CAD",
                "bank_name": "Royal Bank of Canada (RBC)",
                "account_identifier_type": "INTERAC_EMAIL",
                "account_identifier": "sophie.t@creatives.ca",
                "routing_code": "003-00012",
                "relationship": "Friend",
                "is_favorite": True
            }
        ]

        # Payment Methods
        self.payment_methods = [
            {
                "id": "pm_1",
                "type": "DEBIT_CARD",
                "brand": "Visa",
                "last_four": "4242",
                "expiry": "09/28",
                "is_default": True,
                "label": "Chase Sapphire Visa Debit"
            },
            {
                "id": "pm_2",
                "type": "BANK_ACCOUNT",
                "brand": "Bank of America",
                "last_four": "8812",
                "expiry": "N/A",
                "is_default": False,
                "label": "BofA Premier Checking (ACH)"
            },
            {
                "id": "pm_3",
                "type": "CREDIT_CARD",
                "brand": "Mastercard",
                "last_four": "9812",
                "expiry": "11/27",
                "is_default": False,
                "label": "Apple Card Mastercard"
            }
        ]

        # KYC Record
        self.kyc_record = {
            "id": "kyc_88910",
            "verification_status": "APPROVED", # APPROVED, PENDING, IN_REVIEW, REJECTED
            "document_type": "PASSPORT",
            "document_number": "P891238491",
            "document_issuing_country": "USA",
            "document_expiry_date": "2031-10-15",
            "document_front_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
            "selfie_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            "risk_score": 4.5,
            "pep_check_passed": True,
            "sanctions_check_passed": True,
            "submitted_at": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(),
            "reviewed_at": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(),
            "reviewed_by": "Compliance AI & Officer #104"
        }

        # Transactions
        self.transactions = [
            {
                "id": "tx_101",
                "reference_number": "GP-202610-F92B10",
                "transaction_type": "SEND_MONEY",
                "sender_currency": "USD",
                "sender_amount": 1200.00,
                "exchange_rate": 83.4250,
                "transfer_fee": 3.99,
                "fx_spread_fee": 1.20,
                "total_charged": 1200.00,
                "recipient_currency": "INR",
                "recipient_amount": 99797.30,
                "beneficiary_name": "Aarav Sharma",
                "payment_channel": "UPI Instant Express",
                "status": "COMPLETED",
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=3, minutes=15)).isoformat(),
                "completed_at": (datetime.now(timezone.utc) - timedelta(hours=3, minutes=14)).isoformat(),
                "purpose": "Family Support & Maintenance",
                "payment_method": "USD Wallet Balance",
                "risk_score": 3.2
            },
            {
                "id": "tx_102",
                "reference_number": "GP-202610-A19C48",
                "transaction_type": "SEND_MONEY",
                "sender_currency": "USD",
                "sender_amount": 2500.00,
                "exchange_rate": 0.7842,
                "transfer_fee": 6.25,
                "fx_spread_fee": 2.50,
                "total_charged": 2500.00,
                "recipient_currency": "GBP",
                "recipient_amount": 1955.59,
                "beneficiary_name": "Eleanor Vance",
                "payment_channel": "UK Faster Payments",
                "status": "COMPLETED",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=1, hours=4)).isoformat(),
                "completed_at": (datetime.now(timezone.utc) - timedelta(days=1, hours=3, minutes=58)).isoformat(),
                "purpose": "Consultancy & Design Services",
                "payment_method": "Chase Sapphire Visa Debit",
                "risk_score": 4.1
            },
            {
                "id": "tx_103",
                "reference_number": "GP-202609-C38B01",
                "transaction_type": "CONVERT_CURRENCY",
                "sender_currency": "USD",
                "sender_amount": 1500.00,
                "exchange_rate": 0.9215,
                "transfer_fee": 2.25,
                "fx_spread_fee": 1.50,
                "total_charged": 1500.00,
                "recipient_currency": "EUR",
                "recipient_amount": 1380.18,
                "beneficiary_name": "EUR Personal Balance",
                "payment_channel": "Internal FX Ledger",
                "status": "COMPLETED",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
                "completed_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
                "purpose": "Currency Hedging / Euro Travel",
                "payment_method": "USD Wallet",
                "risk_score": 1.0
            },
            {
                "id": "tx_104",
                "reference_number": "GP-202609-E88F92",
                "transaction_type": "RECEIVE_MONEY",
                "sender_currency": "EUR",
                "sender_amount": 850.00,
                "exchange_rate": 1.0000,
                "transfer_fee": 0.00,
                "fx_spread_fee": 0.00,
                "total_charged": 850.00,
                "recipient_currency": "EUR",
                "recipient_amount": 850.00,
                "beneficiary_name": "Received from Markus Weber",
                "payment_channel": "SEPA Credit Transfer",
                "status": "COMPLETED",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
                "completed_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
                "purpose": "Invoice Settlement #1042",
                "payment_method": "SEPA Direct",
                "risk_score": 2.0
            },
            {
                "id": "tx_105",
                "reference_number": "GP-202609-D21F45",
                "transaction_type": "ADD_MONEY",
                "sender_currency": "USD",
                "sender_amount": 5000.00,
                "exchange_rate": 1.0000,
                "transfer_fee": 0.00,
                "fx_spread_fee": 0.00,
                "total_charged": 5000.00,
                "recipient_currency": "USD",
                "recipient_amount": 5000.00,
                "beneficiary_name": "Deposit from Bank of America",
                "payment_channel": "ACH Direct Deposit",
                "status": "COMPLETED",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
                "completed_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
                "purpose": "Wallet Funding",
                "payment_method": "ACH Direct Debit",
                "risk_score": 1.5
            },
            {
                "id": "tx_106",
                "reference_number": "GP-202609-K99D12",
                "transaction_type": "SEND_MONEY",
                "sender_currency": "USD",
                "sender_amount": 3200.00,
                "exchange_rate": 151.85,
                "transfer_fee": 8.50,
                "fx_spread_fee": 3.20,
                "total_charged": 3200.00,
                "recipient_currency": "JPY",
                "recipient_amount": 484644,
                "beneficiary_name": "Kenji Takahashi",
                "payment_channel": "Zengin Express Wire",
                "status": "PROCESSING",
                "created_at": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
                "completed_at": None,
                "purpose": "Freelance Dev Milestone #2",
                "payment_method": "USD Wallet",
                "risk_score": 4.8
            }
        ]

        # Notifications
        self.notifications = [
            {
                "id": "notif_1",
                "title": "Transfer In Progress",
                "message": "Your transfer of 3,200 USD to Kenji Takahashi is processing via Zengin network.",
                "category": "TRANSFER",
                "is_read": False,
                "created_at": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()
            },
            {
                "id": "notif_2",
                "title": "Transfer Completed",
                "message": "Transfer of 1,200 USD (₹99,797.30 INR) to Aarav Sharma was delivered successfully.",
                "category": "TRANSFER",
                "is_read": False,
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
            },
            {
                "id": "notif_3",
                "title": "KYC Verification Approved",
                "message": "Your Tier 2 identity verification has been confirmed! Your daily transfer limit is now $25,000 USD.",
                "category": "KYC",
                "is_read": True,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat()
            },
            {
                "id": "notif_4",
                "title": "FX Market Alert: USD/EUR",
                "message": "EUR exchange rate rose by +0.45% in the last 24 hours. Great time to convert!",
                "category": "RATE_ALERT",
                "is_read": True,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            },
            {
                "id": "notif_5",
                "title": "New Login Detected",
                "message": "Successful login from Chrome on Windows (San Francisco, CA, IP: 198.51.100.24).",
                "category": "SECURITY",
                "is_read": True,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
            }
        ]

        # Active Sessions
        self.active_sessions = [
            {
                "id": "sess_current",
                "device": "Chrome on Windows 11 (Current)",
                "ip_address": "198.51.100.24",
                "location": "San Francisco, CA, USA",
                "last_active": "Just now",
                "is_current": True
            },
            {
                "id": "sess_mobile",
                "device": "GlobalPay iOS App (iPhone 15 Pro)",
                "ip_address": "172.56.21.90",
                "location": "San Francisco, CA, USA",
                "last_active": "4 hours ago",
                "is_current": False
            },
            {
                "id": "sess_laptop",
                "device": "Safari on MacBook Pro (macOS 14)",
                "ip_address": "198.51.100.24",
                "location": "San Francisco, CA, USA",
                "last_active": "2 days ago",
                "is_current": False
            }
        ]

        # Security & Audit Logs
        self.audit_logs = [
            {"id": "aud_1", "event": "2FA TOTP Verified", "category": "AUTH", "ip": "198.51.100.24", "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat(), "status": "SUCCESS"},
            {"id": "aud_2", "event": "Transfer Initiated to Kenji Takahashi ($3,200)", "category": "TRANSFER", "ip": "198.51.100.24", "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(), "status": "PENDING"},
            {"id": "aud_3", "event": "Transfer Completed to Aarav Sharma ($1,200)", "category": "TRANSFER", "ip": "198.51.100.24", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(), "status": "SUCCESS"},
            {"id": "aud_4", "event": "Beneficiary Added: Kenji Takahashi", "category": "BENEFICIARY", "ip": "198.51.100.24", "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "status": "SUCCESS"},
            {"id": "aud_5", "event": "Password Changed", "category": "SECURITY", "ip": "198.51.100.24", "timestamp": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat(), "status": "SUCCESS"},
            {"id": "aud_6", "event": "KYC Document Approved (Tier 2)", "category": "COMPLIANCE", "ip": "10.0.4.12", "timestamp": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(), "status": "APPROVED"}
        ]

        # Admin KYC Queue (Simulated other users in verification queue)
        self.admin_kyc_queue = [
            {
                "id": "kyc_q1",
                "user_name": "Liam O'Connor",
                "user_email": "liam.oc@dublintech.ie",
                "country": "IRL",
                "document_type": "PASSPORT",
                "document_number": "PA9821443",
                "risk_score": 12.0,
                "status": "PENDING",
                "submitted_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
                "front_image": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
                "selfie_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
            },
            {
                "id": "kyc_q2",
                "user_name": "Priya Patel",
                "user_email": "priya.patel@mumbai.in",
                "country": "IND",
                "document_type": "NATIONAL_ID",
                "document_number": "AADHAAR-8901",
                "risk_score": 8.5,
                "status": "PENDING",
                "submitted_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
                "front_image": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
                "selfie_image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
            },
            {
                "id": "kyc_q3",
                "user_name": "Carlos Rodriguez",
                "user_email": "carlos.r@madrid.es",
                "country": "ESP",
                "document_type": "DRIVERS_LICENSE",
                "document_number": "ES-D-881920",
                "risk_score": 28.0,
                "status": "PENDING",
                "submitted_at": (datetime.now(timezone.utc) - timedelta(hours=9)).isoformat(),
                "front_image": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
                "selfie_image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
            }
        ]

        # Admin Fraud/Risk Alerts
        self.risk_alerts = [
            {
                "id": "risk_1",
                "severity": "HIGH",
                "rule": "High-Velocity Cross-Border Spike",
                "description": "User #4901 attempted 4 transfers totaling $38,000 within 12 minutes to high-risk corridor.",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1, minutes=20)).isoformat(),
                "status": "FLAGGED",
                "suggested_action": "Freeze Wallet & Request Proof of Source of Funds"
            },
            {
                "id": "risk_2",
                "severity": "MEDIUM",
                "rule": "Sanction Name Fuzzy Match Flag",
                "description": "Beneficiary name match 87% similarity with OFAC SDN list entry. Automated hold applied.",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
                "status": "UNDER_REVIEW",
                "suggested_action": "Manual Compliance Officer Screening"
            },
            {
                "id": "risk_3",
                "severity": "LOW",
                "rule": "Unusual IP Geolocation Hopping",
                "description": "Session IP changed from Germany to Singapore within 25 minutes without VPN attestation.",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=11)).isoformat(),
                "status": "RESOLVED",
                "suggested_action": "Step-up 2FA Challenge"
            }
        ]

        # Platform Admin Settings
        self.admin_settings = {
            "fx_markup_percentage": 0.35, # 0.35%
            "base_transfer_fee_usd": 0.99,
            "min_transfer_usd": 1.0,
            "max_transfer_tier1_usd": 1000.0,
            "max_transfer_tier2_usd": 25000.0,
            "system_sandbox_mode": True
        }


db = DataStore()

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email_or_phone: str
    password: str

class OTPVerifyRequest(BaseModel):
    email_or_phone: str
    otp_code: str

class TransferQuoteRequest(BaseModel):
    sender_currency: str
    recipient_currency: str
    sender_amount: float
    payment_method: str = "WALLET"

class SendMoneyRequest(BaseModel):
    beneficiary_id: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_country: str
    recipient_currency: str
    sender_currency: str
    sender_amount: float
    payment_method: str # WALLET, DEBIT_CARD, BANK_ACCOUNT
    purpose: str = "Family Support"
    otp_code: Optional[str] = "123456"

class ConvertCurrencyRequest(BaseModel):
    from_currency: str
    to_currency: str
    amount: float

class AddMoneyRequest(BaseModel):
    currency: str
    amount: float
    payment_method: str

class BeneficiaryCreateRequest(BaseModel):
    full_name: str
    nickname: Optional[str] = None
    email: Optional[str] = None
    country_code: str
    currency_code: str
    bank_name: str
    account_identifier_type: str # IBAN, ACCOUNT_NUMBER, UPI_ID, INTERAC_EMAIL
    account_identifier: str
    routing_code: Optional[str] = None
    relationship: str = "Friend / Family"

class KYCSubmitRequest(BaseModel):
    document_type: str
    document_number: str
    issuing_country: str
    expiry_date: Optional[str] = None
    document_front_data: Optional[str] = None
    selfie_data: Optional[str] = None

class AdminKYCDecisionRequest(BaseModel):
    decision: str # APPROVE or REJECT
    reason: Optional[str] = None

class AdminFeeUpdateRequest(BaseModel):
    fx_markup_percentage: float
    base_transfer_fee_usd: float

# -----------------------------------------------------------------------------
# AUTH & USER ENDPOINTS
# -----------------------------------------------------------------------------

@app.post("/api/auth/login")
def login(payload: LoginRequest):
    # For demo prototype, accept demo credentials or any valid email
    # Auto-generate OTP challenge if 2FA is active
    email = payload.email_or_phone.strip()
    return {
        "status": "OTP_REQUIRED",
        "message": "One-Time Password has been sent to your registered device / Authenticator",
        "email": email,
        "demo_otp_hint": "123456",
        "two_factor_type": "TOTP / SMS"
    }

@app.post("/api/auth/verify-otp")
def verify_otp(payload: OTPVerifyRequest):
    if payload.otp_code not in ["123456", "000000", "999999"] and len(payload.otp_code) != 6:
        raise HTTPException(status_code=400, detail="Invalid OTP code. For demo, use 123456.")
    
    token = f"gp_token_{uuid.uuid4().hex}"
    return {
        "status": "SUCCESS",
        "token": token,
        "user": db.user,
        "message": "Authentication successful"
    }

@app.post("/api/auth/register")
def register(payload: Dict[str, Any]):
    return {
        "status": "OTP_REQUIRED",
        "message": "Account created! Please enter verification code.",
        "email": payload.get("email", "newuser@globalpay.io"),
        "demo_otp_hint": "123456"
    }

@app.get("/api/auth/me")
def get_current_user():
    return db.user

@app.post("/api/auth/toggle-2fa")
def toggle_2fa():
    db.user["two_factor_enabled"] = not db.user["two_factor_enabled"]
    event_str = "2FA Enabled" if db.user["two_factor_enabled"] else "2FA Disabled"
    db.audit_logs.insert(0, {
        "id": f"aud_{uuid.uuid4().hex[:6]}",
        "event": event_str,
        "category": "SECURITY",
        "ip": "198.51.100.24",
        "timestamp": get_current_iso(),
        "status": "SUCCESS"
    })
    return {"two_factor_enabled": db.user["two_factor_enabled"]}

# -----------------------------------------------------------------------------
# WALLETS & CONVERSION ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/wallets")
def get_wallets():
    rates = fx_engine.refresh_rates()
    total_in_usd = 0.0
    wallet_list = []
    
    for code, data in db.wallets.items():
        rate_vs_usd = rates.get(code, 1.0)
        # convert balance to USD: balance / rate_vs_usd
        val_usd = data["balance"] / rate_vs_usd if rate_vs_usd > 0 else 0
        total_in_usd += val_usd
        meta = CURRENCY_METADATA.get(code, {})
        wallet_list.append({
            "code": code,
            "name": meta.get("name", code),
            "symbol": meta.get("symbol", ""),
            "flag": meta.get("flag", "🌐"),
            "country": meta.get("country", ""),
            "balance": round(data["balance"], meta.get("decimals", 2)),
            "equivalent_usd": round(val_usd, 2),
            "account_number": data["account_number"],
            "routing_number": data["routing_number"],
            "type": data["type"]
        })
    
    # Sort to place USD, EUR, GBP, INR first
    priority = {"USD": 1, "EUR": 2, "GBP": 3, "INR": 4, "CAD": 5, "AUD": 6, "AED": 7, "SGD": 8, "JPY": 9}
    wallet_list.sort(key=lambda w: priority.get(w["code"], 99))

    return {
        "total_balance_usd": round(total_in_usd, 2),
        "primary_currency": "USD",
        "wallets": wallet_list
    }

@app.post("/api/wallets/convert")
def convert_wallet_currency(payload: ConvertCurrencyRequest):
    from_curr = payload.from_currency.upper()
    to_curr = payload.to_currency.upper()
    amount = float(payload.amount)

    if from_curr not in db.wallets or to_curr not in db.wallets:
        raise HTTPException(status_code=400, detail="Unsupported currency.")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Conversion amount must be greater than zero.")
    if db.wallets[from_curr]["balance"] < amount:
        raise HTTPException(status_code=400, detail=f"Insufficient {from_curr} balance.")

    quote = fx_engine.calculate_transfer(from_curr, to_curr, amount, payment_method="WALLET")
    net_received = quote["recipient_amount"]

    # Execute balance change
    db.wallets[from_curr]["balance"] = round(db.wallets[from_curr]["balance"] - amount, 2)
    db.wallets[to_curr]["balance"] = round(db.wallets[to_curr]["balance"] + net_received, 2)

    # Record transaction
    ref = generate_ref()
    tx = {
        "id": f"tx_{uuid.uuid4().hex[:8]}",
        "reference_number": ref,
        "transaction_type": "CONVERT_CURRENCY",
        "sender_currency": from_curr,
        "sender_amount": amount,
        "exchange_rate": quote["effective_rate"],
        "transfer_fee": quote["transfer_fee"],
        "fx_spread_fee": round(amount * 0.0035, 2),
        "total_charged": amount,
        "recipient_currency": to_curr,
        "recipient_amount": net_received,
        "beneficiary_name": f"{to_curr} Wallet Conversion",
        "payment_channel": "Instant Ledger Conversion",
        "status": "COMPLETED",
        "created_at": get_current_iso(),
        "completed_at": get_current_iso(),
        "purpose": f"Currency exchange from {from_curr} to {to_curr}",
        "payment_method": f"{from_curr} Wallet",
        "risk_score": 1.0
    }
    db.transactions.insert(0, tx)

    # Add notification
    db.notifications.insert(0, {
        "id": f"notif_{uuid.uuid4().hex[:6]}",
        "title": "Currency Converted Successfully",
        "message": f"Converted {amount:.2f} {from_curr} to {net_received:.2f} {to_curr} at rate {quote['effective_rate']}.",
        "category": "TRANSFER",
        "is_read": False,
        "created_at": get_current_iso()
    })

    return {
        "status": "SUCCESS",
        "transaction": tx,
        "new_from_balance": db.wallets[from_curr]["balance"],
        "new_to_balance": db.wallets[to_curr]["balance"],
        "message": f"Successfully exchanged {amount} {from_curr} for {net_received} {to_curr}"
    }

@app.post("/api/wallets/deposit")
def add_money(payload: AddMoneyRequest):
    curr = payload.currency.upper()
    amount = float(payload.amount)
    if curr not in db.wallets:
        raise HTTPException(status_code=400, detail="Invalid currency.")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive.")

    db.wallets[curr]["balance"] = round(db.wallets[curr]["balance"] + amount, 2)
    ref = generate_ref()
    tx = {
        "id": f"tx_{uuid.uuid4().hex[:8]}",
        "reference_number": ref,
        "transaction_type": "ADD_MONEY",
        "sender_currency": curr,
        "sender_amount": amount,
        "exchange_rate": 1.0,
        "transfer_fee": 0.0,
        "fx_spread_fee": 0.0,
        "total_charged": amount,
        "recipient_currency": curr,
        "recipient_amount": amount,
        "beneficiary_name": f"Deposit to {curr} Wallet",
        "payment_channel": payload.payment_method,
        "status": "COMPLETED",
        "created_at": get_current_iso(),
        "completed_at": get_current_iso(),
        "purpose": "Wallet Funding",
        "payment_method": payload.payment_method,
        "risk_score": 1.0
    }
    db.transactions.insert(0, tx)

    db.notifications.insert(0, {
        "id": f"notif_{uuid.uuid4().hex[:6]}",
        "title": "Funds Deposited",
        "message": f"Successfully added {amount:.2f} {curr} to your wallet via {payload.payment_method}.",
        "category": "TRANSFER",
        "is_read": False,
        "created_at": get_current_iso()
    })

    return {
        "status": "SUCCESS",
        "new_balance": db.wallets[curr]["balance"],
        "transaction": tx
    }

# -----------------------------------------------------------------------------
# FX RATES & QUOTES
# -----------------------------------------------------------------------------

@app.get("/api/rates/latest")
def get_latest_rates(base: str = "USD"):
    return fx_engine.get_all_pairs_summary(base=base.upper())

@app.post("/api/rates/quote")
def get_transfer_quote(payload: TransferQuoteRequest):
    return fx_engine.calculate_transfer(
        from_curr=payload.sender_currency.upper(),
        to_curr=payload.recipient_currency.upper(),
        send_amount=float(payload.sender_amount),
        payment_method=payload.payment_method
    )

# -----------------------------------------------------------------------------
# SEND MONEY & TRANSACTIONS
# -----------------------------------------------------------------------------

@app.post("/api/transactions/send")
def send_money(payload: SendMoneyRequest):
    sender_curr = payload.sender_currency.upper()
    recip_curr = payload.recipient_currency.upper()
    amount = float(payload.sender_amount)

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be greater than zero.")

    # Check daily limit per KYC tier
    daily_limit = db.user["profile"]["daily_limit_usd"]
    # Estimate in USD
    rates = fx_engine.refresh_rates()
    rate_to_usd = rates.get(sender_curr, 1.0)
    usd_val = amount / rate_to_usd if rate_to_usd > 0 else amount
    if usd_val > daily_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Amount exceeds your daily Tier {db.user['profile']['tier_level']} limit of ${daily_limit:,.2f} USD. Please upgrade KYC."
        )

    # If paying from wallet, verify balance
    if "WALLET" in payload.payment_method.upper():
        if db.wallets.get(sender_curr, {}).get("balance", 0) < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient {sender_curr} balance in your GlobalPay wallet.")
        db.wallets[sender_curr]["balance"] = round(db.wallets[sender_curr]["balance"] - amount, 2)

    # Calculate final transparent quote
    quote = fx_engine.calculate_transfer(sender_curr, recip_curr, amount, payment_method=payload.payment_method)

    # Beneficiary name lookup
    beneficiary_title = payload.recipient_name or "International Recipient"
    if payload.beneficiary_id:
        for b in db.beneficiaries:
            if b["id"] == payload.beneficiary_id:
                beneficiary_title = b["full_name"]
                break

    ref = generate_ref()
    tx_id = f"tx_{uuid.uuid4().hex[:8]}"

    # Risk score calculation simulation (AML check)
    risk_score = 4.2
    if amount > 10000:
        risk_score = 18.5

    tx = {
        "id": tx_id,
        "reference_number": ref,
        "transaction_type": "SEND_MONEY",
        "sender_currency": sender_curr,
        "sender_amount": round(amount, 2),
        "exchange_rate": quote["effective_rate"],
        "transfer_fee": quote["transfer_fee"],
        "fx_spread_fee": round(amount * 0.0035, 2),
        "total_charged": round(amount, 2),
        "recipient_currency": recip_curr,
        "recipient_amount": quote["recipient_amount"],
        "beneficiary_name": beneficiary_title,
        "recipient_country": payload.recipient_country,
        "payment_channel": f"Cross-Border Fast Network ({recip_curr})",
        "status": "PROCESSING", # Initially processing, completed via simulation or instant
        "created_at": get_current_iso(),
        "completed_at": None,
        "purpose": payload.purpose,
        "payment_method": payload.payment_method,
        "risk_score": risk_score,
        "estimated_delivery": quote["estimated_delivery"]
    }

    db.transactions.insert(0, tx)

    # Push notification
    db.notifications.insert(0, {
        "id": f"notif_{uuid.uuid4().hex[:6]}",
        "title": "Transfer Sent Successfully",
        "message": f"Sent {amount:.2f} {sender_curr} to {beneficiary_title} ({quote['recipient_amount']:.2f} {recip_curr}). Reference: {ref}.",
        "category": "TRANSFER",
        "is_read": False,
        "created_at": get_current_iso()
    })

    # Security audit log
    db.audit_logs.insert(0, {
        "id": f"aud_{uuid.uuid4().hex[:6]}",
        "event": f"Send Money {sender_curr} {amount:,.2f} -> {recip_curr} ({ref})",
        "category": "TRANSFER",
        "ip": "198.51.100.24",
        "timestamp": get_current_iso(),
        "status": "PROCESSING"
    })

    return {
        "status": "SUCCESS",
        "transaction": tx,
        "receipt": generate_receipt_data(tx),
        "message": "Transfer submitted successfully to the global banking network"
    }

def generate_receipt_data(tx: Dict[str, Any]) -> Dict[str, Any]:
    hash_payload = f"{tx['reference_number']}:{tx['sender_amount']}:{tx['recipient_amount']}:{tx['created_at']}:GLOBALPAY_KEY"
    verif_hash = hashlib.sha256(hash_payload.encode()).hexdigest()[:24].upper()
    return {
        "receipt_number": f"REC-{tx['reference_number']}",
        "transaction_id": tx["id"],
        "reference_number": tx["reference_number"],
        "verification_hash": verif_hash,
        "qr_verification_url": f"https://globalpay.io/verify/{tx['reference_number']}",
        "issued_at": tx.get("completed_at") or tx["created_at"],
        "regulatory_disclaimer": "GlobalPay Sandbox Simulation. Regulated as an Authorized Payment Institution under FinCEN/FCA sandbox parameters.",
        "details": tx
    }

@app.get("/api/transactions")
def get_transactions(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    tx_type: Optional[str] = Query(None)
):
    results = db.transactions
    if q:
        query_str = q.lower().strip()
        results = [
            t for t in results
            if query_str in t["reference_number"].lower()
            or query_str in t["beneficiary_name"].lower()
            or query_str in t.get("purpose", "").lower()
        ]
    if status and status.upper() != "ALL":
        results = [t for t in results if t["status"].upper() == status.upper()]
    if currency and currency.upper() != "ALL":
        results = [
            t for t in results
            if t["sender_currency"].upper() == currency.upper()
            or t["recipient_currency"].upper() == currency.upper()
        ]
    if tx_type and tx_type.upper() != "ALL":
        results = [t for t in results if t["transaction_type"].upper() == tx_type.upper()]

    return {
        "total": len(results),
        "transactions": results
    }

@app.get("/api/transactions/{tx_id}")
def get_transaction_detail(tx_id: str):
    for tx in db.transactions:
        if tx["id"] == tx_id or tx["reference_number"] == tx_id:
            return {
                "transaction": tx,
                "receipt": generate_receipt_data(tx)
            }
    raise HTTPException(status_code=404, detail="Transaction not found.")

@app.get("/api/transactions/{tx_id}/receipt")
def get_transaction_receipt(tx_id: str):
    for tx in db.transactions:
        if tx["id"] == tx_id or tx["reference_number"] == tx_id:
            return generate_receipt_data(tx)
    raise HTTPException(status_code=404, detail="Transaction not found.")

# -----------------------------------------------------------------------------
# BENEFICIARIES
# -----------------------------------------------------------------------------

@app.get("/api/beneficiaries")
def get_beneficiaries():
    return db.beneficiaries

@app.post("/api/beneficiaries")
def create_beneficiary(payload: BeneficiaryCreateRequest):
    new_ben = {
        "id": f"ben_{uuid.uuid4().hex[:6]}",
        "full_name": payload.full_name,
        "nickname": payload.nickname or payload.full_name,
        "email": payload.email,
        "country_code": payload.country_code.upper(),
        "currency_code": payload.currency_code.upper(),
        "bank_name": payload.bank_name,
        "account_identifier_type": payload.account_identifier_type,
        "account_identifier": payload.account_identifier,
        "routing_code": payload.routing_code or "N/A",
        "relationship": payload.relationship,
        "is_favorite": False
    }
    db.beneficiaries.append(new_ben)
    db.audit_logs.insert(0, {
        "id": f"aud_{uuid.uuid4().hex[:6]}",
        "event": f"Beneficiary Added: {payload.full_name}",
        "category": "BENEFICIARY",
        "ip": "198.51.100.24",
        "timestamp": get_current_iso(),
        "status": "SUCCESS"
    })
    return {"status": "SUCCESS", "beneficiary": new_ben}

@app.delete("/api/beneficiaries/{ben_id}")
def delete_beneficiary(ben_id: str):
    db.beneficiaries = [b for b in db.beneficiaries if b["id"] != ben_id]
    return {"status": "SUCCESS", "message": "Beneficiary removed"}

@app.post("/api/beneficiaries/{ben_id}/toggle-favorite")
def toggle_favorite_beneficiary(ben_id: str):
    for b in db.beneficiaries:
        if b["id"] == ben_id:
            b["is_favorite"] = not b["is_favorite"]
            return {"status": "SUCCESS", "is_favorite": b["is_favorite"]}
    raise HTTPException(status_code=404, detail="Beneficiary not found")

# -----------------------------------------------------------------------------
# PROFILE & KYC ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/profile")
def get_profile():
    return {
        "user": db.user,
        "kyc": db.kyc_record
    }

@app.put("/api/profile")
def update_profile(payload: Dict[str, Any]):
    for key, val in payload.items():
        if key in db.user["profile"]:
            db.user["profile"][key] = val
    return {"status": "SUCCESS", "profile": db.user["profile"]}

@app.get("/api/kyc")
def get_kyc_status():
    return db.kyc_record

@app.post("/api/kyc/submit")
def submit_kyc(payload: KYCSubmitRequest):
    db.kyc_record.update({
        "verification_status": "APPROVED", # Auto-approve for demo realism or set to PENDING
        "document_type": payload.document_type,
        "document_number": payload.document_number,
        "document_issuing_country": payload.issuing_country,
        "document_expiry_date": payload.expiry_date or "2032-12-31",
        "document_front_url": payload.document_front_data or db.kyc_record["document_front_url"],
        "selfie_url": payload.selfie_data or db.kyc_record["selfie_url"],
        "submitted_at": get_current_iso(),
        "reviewed_at": get_current_iso(),
        "reviewed_by": "Compliance AI Real-Time Agent"
    })
    db.user["profile"]["tier_level"] = 2
    db.user["profile"]["tier_name"] = "Verified Account"
    db.user["profile"]["daily_limit_usd"] = 25000.0

    db.notifications.insert(0, {
        "id": f"notif_{uuid.uuid4().hex[:6]}",
        "title": "KYC Approved Instantly",
        "message": f"Your {payload.document_type} verification was approved! Daily limit increased to $25,000 USD.",
        "category": "KYC",
        "is_read": False,
        "created_at": get_current_iso()
    })

    return {
        "status": "APPROVED",
        "kyc": db.kyc_record,
        "message": "Identity verification completed successfully"
    }

# -----------------------------------------------------------------------------
# NOTIFICATIONS & SECURITY SESSIONS
# -----------------------------------------------------------------------------

@app.get("/api/notifications")
def get_notifications():
    unread_count = sum(1 for n in db.notifications if not n["is_read"])
    return {
        "unread_count": unread_count,
        "notifications": db.notifications
    }

@app.put("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str):
    for n in db.notifications:
        if n["id"] == notif_id:
            n["is_read"] = True
            return {"status": "SUCCESS"}
    raise HTTPException(status_code=404, detail="Notification not found")

@app.put("/api/notifications/read-all")
def mark_all_read():
    for n in db.notifications:
        n["is_read"] = True
    return {"status": "SUCCESS"}

@app.get("/api/security/sessions")
def get_sessions():
    return db.active_sessions

@app.delete("/api/security/sessions/{sess_id}")
def revoke_session(sess_id: str):
    db.active_sessions = [s for s in db.active_sessions if s["id"] != sess_id]
    return {"status": "SUCCESS", "message": "Session revoked"}

@app.get("/api/security/audit-logs")
def get_audit_logs():
    return db.audit_logs

# -----------------------------------------------------------------------------
# ADMIN DASHBOARD ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/admin/metrics")
def get_admin_metrics():
    total_volume_usd = sum(
        t["sender_amount"] if t["sender_currency"] == "USD" else t["sender_amount"] / 1.1
        for t in db.transactions
    )
    return {
        "total_volume_usd": round(total_volume_usd, 2),
        "total_transactions": len(db.transactions),
        "active_users": 1420,
        "pending_kyc_count": len([k for k in db.admin_kyc_queue if k["status"] == "PENDING"]),
        "open_risk_alerts": len([r for r in db.risk_alerts if r["status"] != "RESOLVED"]),
        "supported_currencies_count": len(CURRENCY_METADATA),
        "system_status": "All Systems Operational (99.99% SLA)",
        "sandbox_mode": db.admin_settings["system_sandbox_mode"]
    }

@app.get("/api/admin/users")
def get_admin_users():
    return [
        {
            "id": db.user["id"],
            "name": f"{db.user['profile']['first_name']} {db.user['profile']['last_name']}",
            "email": db.user["email"],
            "country": db.user["profile"]["country_of_residence"],
            "kyc_status": db.kyc_record["verification_status"],
            "tier": db.user["profile"]["tier_level"],
            "risk_score": 4.5,
            "status": db.user["account_status"]
        },
        {
            "id": "usr_998144b2",
            "name": "Sarah Jenkins",
            "email": "sarah.j@londonfinance.uk",
            "country": "GBR",
            "kyc_status": "APPROVED",
            "tier": 3,
            "risk_score": 2.1,
            "status": "ACTIVE"
        },
        {
            "id": "usr_998144c3",
            "name": "Takeshi Yamada",
            "email": "yamada.t@osaka-tech.jp",
            "country": "JPN",
            "kyc_status": "APPROVED",
            "tier": 2,
            "risk_score": 5.0,
            "status": "ACTIVE"
        },
        {
            "id": "usr_998144d4",
            "name": "Liam O'Connor",
            "email": "liam.oc@dublintech.ie",
            "country": "IRL",
            "kyc_status": "PENDING",
            "tier": 1,
            "risk_score": 12.0,
            "status": "ACTIVE"
        }
    ]

@app.get("/api/admin/kyc-queue")
def get_admin_kyc_queue():
    return db.admin_kyc_queue

@app.post("/api/admin/kyc/{item_id}/decision")
def review_kyc_item(item_id: str, payload: AdminKYCDecisionRequest):
    for item in db.admin_kyc_queue:
        if item["id"] == item_id:
            item["status"] = "APPROVED" if payload.decision.upper() == "APPROVE" else "REJECTED"
            item["review_notes"] = payload.reason or ("Approved by Compliance Lead" if payload.decision.upper() == "APPROVE" else "Rejected: Document mismatch")
            return {"status": "SUCCESS", "item": item}
    raise HTTPException(status_code=404, detail="Queue item not found")

@app.get("/api/admin/risk-alerts")
def get_risk_alerts():
    return db.risk_alerts

@app.get("/api/admin/fee-settings")
def get_fee_settings():
    return db.admin_settings

@app.put("/api/admin/fee-settings")
def update_fee_settings(payload: AdminFeeUpdateRequest):
    db.admin_settings["fx_markup_percentage"] = payload.fx_markup_percentage
    db.admin_settings["base_transfer_fee_usd"] = payload.base_transfer_fee_usd
    fx_engine.default_markup_percent = payload.fx_markup_percentage
    return {"status": "SUCCESS", "settings": db.admin_settings}

@app.post("/api/system/reset-demo")
def reset_demo_state():
    db.reset_all()
    return {"status": "SUCCESS", "message": "Demo data reset successfully"}

# -----------------------------------------------------------------------------
# STATIC FILE SERVING
# Serves the frontend single-page application and static resources
# -----------------------------------------------------------------------------
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "GlobalPay API is running. index.html not found yet."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
