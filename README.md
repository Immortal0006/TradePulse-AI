<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Docker-CE-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

# 🔮 TradePulse AI — Quantitative Risk & Allocation Engine

> **Institutional-grade risk management and algorithmic execution audits for retail & proprietary traders.**  
> An interactive quantitative trading platform that calculates custom asset allocation limits using strict risk-per-share entry metrics, audits trade setups with a context-aware AI Copilot, isolates transaction slippage with the CostGuard friction engine, and secures execution pipelines with cache-hardened token extraction.

---

## 🔗 Production Links

- **Live Web Application UI:** [https://trade-pulse-ai-gamma.vercel.app/](https://trade-pulse-ai-gamma.vercel.app/)
- **Live Backend API Gateway:** [https://tradepulse-backend-2533.onrender.com/](https://tradepulse-backend-2533.onrender.com/)
- **Interactive API Documentation:** [https://tradepulse-backend-2533.onrender.com/docs](https://tradepulse-backend-2533.onrender.com/docs)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Sandbox Setup](#local-sandbox-setup)
- [How It Works](#how-it-works)
  - [Risk Allocation Engine (Mathematical Model)](#risk-allocation-engine-mathematical-model)
  - [Deterministic Token Extraction & Security Overhaul](#deterministic-token-extraction--security-overhaul)
  - [Granular Input Bulletproofing](#granular-input-bulletproofing)
  - [State Synchronization & Cleanup](#state-synchronization--cleanup)
- [Platform Interface Guide](#platform-interface-guide)
- [Order Execution API](#order-execution-api)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

TradePulse AI bridges the gap between discretionary trading workflows and quantitative rigor. The application provides mathematical validation layers that prevent traders from executing sub-optimal, over-leveraged orders. The system continuously:

1. **Calculates** maximum permissible share volume dynamically based on account capital, target risk percentages, and price thresholds.
2. **Evaluates** momentum vectors and setup validity utilizing a context-aware AI Copilot that maps entry, stop-loss, and take-profit parameters.
3. **Audits** exchange fees, broker fees, transaction taxes, and estimated slippage through the CostGuard engine to verify the true breakeven point.
4. **Monitors** regional market tickers and liquidity pools over persistent, real-time tracking decks.
5. **Logs** live and simulated position histories in a high-density, database-backed transaction ledger linked to secure user sessions.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **📊 Risk Engine** | Dynamically calculates maximum permissible share volumes using custom risk-per-share bounds. Automatically resets inputs on transaction success and features session lockout thresholds. |
| **🤖 AI Copilot & Analyzer** | Context-aware setup auditor providing real-time trend mapping, qualitative risk scoring, and momentum vector validation. |
| **🔔 Watchlist** | Multi-asset tracking deck monitoring real-time regional tickers and immediate institutional liquidity pools. |
| **🛡️ Cost Guard** | Audits transactional drag (brokerage, taxes, clearing, and slippage) to establish the absolute net-breakeven threshold. |
| **🔒 Option Safe** | Specialized options strategy workbench assessing portfolio Greeks ($\Delta$, $\Gamma$, $\Theta$, $Vega$) and tail-risk liquidation barriers. |
| **📝 Trade Journal** | High-density historical audit tables dynamically mapping active/closed positions, action vectors (BUY/SELL), and environment tags (SIMULATED/LIVE). |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  RiskEngine  │  │ OptionSafe     │  │ Trade Journal   │  │
│  │  Component  │  │ Matrix Panel   │  │ History Ledger  │  │
│  └──────┬───────┘  └───────┬────────┘  └────────┬────────┘  │
│         └──────────────────┼────────────────────┘           │
│                            │ HTTPS / Bearer Token Header    │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     BACKEND (FastAPI)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ FastAPI Router (main.py)                              │  │
│  │  ├─► Manual Auth Header Parsing (Bearer Extraction)  │  │
│  │  └─► jose_jwt Cryptographic Session Validation        │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │ Pydantic Validation & Input Guards                    │  │
│  │ (Flexible Int/Float Parsing & Symbol Verification)    │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │ Core Calculation Pipelines                            │  │
│  │  ├─► Risk Engine (Position Sizer)                     │  │
│  │  └─► CostGuard Engine (Breakeven Auditor)             │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     PERSISTENCE LAYER                       │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │ PostgreSQL Relational Database (v16)                  │  │
│  │ (Persistent Session States, Historical Audits)        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI engine supporting declarative states and custom hooks |
| **TypeScript 5.0+** | Strictly typed safety for trading components and payloads |
| **TailwindCSS** | Utility-first CSS styling for dense, responsive dark layouts |
| **Lucide React** | Premium icon pack for dashboard action buttons |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI 0.100+** | High-performance, asynchronous Python web framework |
| **Pydantic v2** | Strict data parsing and request validation contracts |
| **python-jose** | Cryptographic signature validation and JWT processing |
| **SQLAlchemy** | SQL Toolkit and Object Relational Mapper (ORM) |
| **PostgreSQL 16** | Relational data store for structured position ledgers |

---

## Project Structure

```
TradePulse-AI/
├── backend/
│   ├── services/
│   │   ├── ai_copilot.py       # AI setup auditing & vector momentum analysis
│   │   ├── cost_guard.py       # Overhead frictional drag & slippage calculator
│   │   ├── option_safe.py      # Multi-leg options strategy & Greek analyzer
│   │   └── stock_analyzer.py   # Stock allocation sizer models
│   ├── Dockerfile              # Container specifications for backend server
│   ├── analytics.py            # Quantitative data logging & insights engine
│   ├── auth.py                 # JWT token manual extraction and verification
│   ├── cache.py                # Redis/caching connection utility layer
│   ├── database.py             # SQLAlchemy engine creation & session pooler
│   ├── main.py                 # FastAPI app entry point & routes handler
│   ├── models.py               # ORM schemas for Trade Journal ledger
│   ├── orders.py               # Execution models and schemas
│   └── requirements.txt        # Python backend package dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CostGuard.tsx     # CostGuard slippage & fee auditor dashboard UI
│   │   │   ├── Login.tsx         # User authentication & token binding UI
│   │   │   ├── OptionSafe.tsx    # Options Greeks and margin alerts panel
│   │   │   ├── RiskEngine.tsx    # Dynamic allocation calculator & state reset form
│   │   │   ├── TradeJournal.tsx  # Interactive transaction audit ledger
│   │   │   └── Watchlist.tsx     # Multi-asset real-time watchmatrix
│   │   ├── App.tsx             # Main dashboard visual component
│   │   ├── main.tsx            # React application startup script
│   │   └── index.css           # Vanilla CSS layout & dark-theme aesthetics
│   ├── Dockerfile              # Container configuration for frontend UI
│   ├── index.html              # HTML DOM entry template
│   ├── package-lock.json       # Strict package lock versioning metadata
│   ├── package.json            # Node project configuration & dependencies
│   ├── tsconfig.json           # TypeScript compilation settings
│   └── vite.config.ts          # Vite compiler and proxy configurations
│
├── .gitignore                  # Git exclude configurations
├── LICENSE                     # MIT License specification file
└── docker-compose.yml          # Local orchestration config for app containers
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 16** (or Docker)

### Local Sandbox Setup

#### 1. Backend Engine
```bash
# Navigate to the backend directory
cd backend

# Configure a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install core dependencies
pip install -r requirements.txt

# Spin up the FastAPI local dev server
uvicorn main:app --reload --port 8000
```
Local API available at: **`http://localhost:8000`** (Swagger docs at `/docs`)

#### 2. Frontend Interface
```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Spin up the local development server
npm run dev
```
Local interface available at: **`http://localhost:5173`**

---

## How It Works

### Risk Allocation Engine (Mathematical Model)

To defend capital from excessive risk, the platform calculates maximum order sizing dynamically. The relationship between total capital, stop loss, and entry parameters is defined by:

$$V_{\text{max}} = \frac{C_{\text{total}} \times R_{\text{pct}}}{P_{\text{entry}} - P_{\text{stop}}}$$

Where:
- $V_{\text{max}}$ is the maximum permissible share volume (rounded down to the nearest integer).
- $C_{\text{total}}$ represents total available trading capital.
- $R_{\text{pct}}$ is the target risk percentage as a decimal fraction (e.g., $0.015$ represents $1.5\%$ risk per trade).
- $P_{\text{entry}}$ is the custom entry price per unit.
- $P_{\text{stop}}$ is the defense invalidation stop-loss price per unit.

### Deterministic Token Extraction & Security Overhaul

To resolve FastAPI caching traps that lead to intermittent `401 Unauthorized` errors under high load, the implicit dependency injection pattern was replaced with a manual HTTP header parsing architecture inside `auth.py`:

```python
# backend/auth.py
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError

JWT_SECRET = "your-high-entropy-signature-secret-key"
ALGORITHM = "HS256"

def get_current_user_deterministic(request: Request) -> dict:
    # Extract raw Authorization header manually
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session header absent."
        )
    
    try:
        # Isolate and decode Bearer token
        scheme, token = auth_header.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bearer authentication required."
            )
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except (ValueError, JWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cryptographic session validation failed."
        )
```

### Granular Input Bulletproofing

Frontend applications occasionally pass integer values (e.g., `150`) instead of floating-point numbers (`150.0`), triggering Pydantic schema validation failures. The input parsing schema in `orders.py` was updated to handle mixed inputs gracefully:

```python
# backend/orders.py
from pydantic import BaseModel, Field, field_validator

class OrderExecutionRequest(BaseModel):
    symbol: str
    entry_price: float = Field(..., description="Target execution price")
    stop_loss: float = Field(..., description="Invalidation stop threshold")
    quantity: float = Field(..., description="Total size requested")

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        clean_val = value.strip()
        if not clean_val:
            raise ValueError("Execution symbol cannot be empty or null.")
        return clean_val

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Execution volume must be greater than zero.")
        return value
```

### State Synchronization & Cleanup

To improve trading speed, the form state in the client interface resets to default benchmarks automatically upon a successful API execution response inside `RiskEngine.tsx`:

```typescript
// frontend/src/components/RiskEngine.tsx
import React, { useState } from 'react';

export const RiskEngine: React.FC = () => {
  const [entryPrice, setEntryPrice] = useState<number>(150.00);
  const [stopLoss, setStopLoss] = useState<number>(140.00);
  const [ticker, setTicker] = useState<string>("SBIN.NS");

  const resetFormToBaselines = () => {
    setEntryPrice(150.00);
    setStopLoss(140.00);
    setTicker("SBIN.NS");
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('https://tradepulse-backend-2533.onrender.com/api/orders/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker, entry_price: entryPrice, stop_loss: stopLoss })
      });
      const result = await response.json();
      if (result.status === "SUCCESS") {
        resetFormToBaselines(); // Cleanup state back to baseline configurations
      }
    } catch (error) {
      console.error("Order submission execution failed:", error);
    }
  };

  return (
    // Visual JSX Layout structure with strict wrapper brackets
    <div className="risk-engine-container">
      <form onSubmit={handleOrderSubmit}>
        {/* Input elements render cleanly inside wrapped scopes to prevent layout leaks */}
      </form>
    </div>
  );
};
```

---

## Platform Interface Guide

The TradePulse AI dashboard is organized into functional zones:

- **Risk Engine:** Input account capital, risk percent, entry price, and stop-loss. Computes total position size, risk exposure, and maximum shares. Auto-locks if risk rules are violated.
- **AI Risk Translator Panel:** Generates live structural risk explanations using Gemini risk models.
- **Cost Guard:** Evaluates slippage thresholds, fee audits, and breakeven offsets.
- **Option Safe:** Scans options matrices, monitors margin boundaries, and tracks options Greeks ($\Delta$, $\Gamma$, $\Theta$, $Vega$).
- **Trade Journal:** Features a Mindset Auditor where users commit position entries alongside behavioral tags (e.g., `DISCIPLINED`).
- **Watchlist:** Real-time stream of ticks and institutional order sizes.

---

## Order Execution API

### Endpoint

```
POST https://tradepulse-backend-2533.onrender.com/api/orders/execute
```

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "symbol": "SBIN.NS",
  "entry_price": 150.00,
  "stop_loss": 140.00,
  "quantity": 100
}
```

### Response

```json
{
  "status": "SUCCESS",
  "transaction_id": "tx_8932479238479823",
  "executed_quantity": 100,
  "execution_price": 150.00,
  "costguard_breakeven_threshold": 150.45,
  "environment": "SIMULATED"
}
```

---

## Configuration

| Environment Variable | Default Value | Description |
|---|---|---|
| `JWT_SECRET` | `ChangeThisToSomethingSecure` | Signature key for user authentication |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/trade_db` | Relational database connection string |
| `DEFAULT_RISK_LIMIT` | `2.0` | Default percentage cap allowed per trade |
| `SLIPPAGE_BIAS_BPS` | `5` | slippage calculation offset in basis points |

---

## Contributing
* We welcome contributions! Please fork the repo, create a feature branch, and submit a PR.
1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  Built with 🧠 quantitative models and 🛡️ security-hardened pipelines
</p>
