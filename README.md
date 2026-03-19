# 🛡️ KavachForWork
### *AI-Powered Climate Risk Protection for Outdoor Workers*

> **KavachForWork** is an **InsurTech prototype** designed to protect outdoor workers from extreme heat conditions.
> By combining **mobile sensor data, climate APIs, AI verification, and automated payouts**, the system detects genuine heatwave exposure and instantly compensates workers.

Developed by **Team dotExe**, this project explores how **technology, artificial intelligence, and decentralized risk verification** can create **next-generation climate insurance systems**.

---

# 🌍 Problem Statement

Millions of workers in India — including **delivery drivers, construction workers, and street vendors** — work under extreme heat conditions.

During heatwaves:

* Temperatures often exceed **45°C**
* Workers are forced to stop working
* Daily income is lost
* There is **no instant protection system**

Traditional insurance:

❌ Requires paperwork
❌ Takes weeks for claims
❌ Difficult fraud detection
❌ Not real-time

---

# 💡 Our Solution

**KavachForWork** introduces a **smart AI-driven micro-insurance system**.

It works by combining:

📱 **Smartphone temperature sensors**
🌡 **Live weather APIs**
🤖 **AI fraud detection**
💰 **Automated weekly micro-insurance**

The system automatically verifies if a worker is truly exposed to a heatwave and **instantly pays compensation**.

---

# 🚀 Key Features

### 🛡 Climate Shield Activation

Workers subscribe to a **weekly protection plan**.

If the climate becomes dangerous, the system automatically validates their claim.

---

### 🤖 AI Fraud Detection

The system detects fraudulent claims using a **Random Forest ML model** by analyzing:

* Local temperature
* Phone battery temperature
* Environmental conditions

---

### ⚡ Instant Payout System

When conditions are verified:

```
Worker exposed to heatwave
        ↓
AI confirms authenticity
        ↓
System triggers payout
        ↓
Money credited instantly
```

---

### 📊 Admin Profit Dashboard

Admins can view:

* Total premiums collected
* Total payouts
* Fraud attempts blocked
* Active protection zones

---

### 🗺 Live Worker Protection Map

Using **interactive maps**, administrators can visualize **where workers are currently protected**.

---

# 🏗 Project Architecture

KavachForWork is built using a **hybrid multi-layer architecture** combining:

* Web Technologies
* Mobile Native APIs
* Artificial Intelligence
* Backend Microservices
* Cloud Database

---

# 📐 System Architecture Diagram

```
                ┌──────────────────────┐
                │      Worker App      │
                │      (React UI)      │
                └──────────┬───────────┘
                           │
                           │
                     Capacitor Bridge
                           │
                           ▼
               ┌────────────────────────┐
               │  Android Native Layer  │
               │   (Java Bridge API)    │
               │ Reads Battery Temp     │
               └──────────┬─────────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │  Node.js API   │
                  │ Express Server │
                  └───────┬────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Python AI Verification │
              │   Random Forest Model  │
              └─────────┬──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   MongoDB    │
                 │ User Wallets │
                 └──────┬───────┘
                        │
                        ▼
                ┌──────────────┐
                │ React Admin  │
                │ Dashboard    │
                └──────────────┘
```

---

# 🧰 Tech Stack

## Frontend

| Technology        | Purpose                           |
| ----------------- | --------------------------------- |
| **React.js**      | User dashboard                    |
| **Capacitor**     | Bridge web app to mobile hardware |
| **Recharts**      | Data visualization                |
| **React Leaflet** | Interactive map                   |

---

## Backend

| Technology     | Purpose           |
| -------------- | ----------------- |
| **Node.js**    | Backend server    |
| **Express.js** | REST API          |
| **Cron Jobs**  | Weekly automation |
| **MongoDB**    | Data storage      |

---

## AI Layer

| Technology              | Purpose         |
| ----------------------- | --------------- |
| **Python**              | AI engine       |
| **FastAPI**             | ML microservice |
| **Random Forest Model** | Fraud detection |

---

## Mobile Layer

| Technology         | Purpose                           |
| ------------------ | --------------------------------- |
| **Android (Java)** | Native sensor bridge              |
| **Capacitor**      | Connect React to Android hardware |

---

# ⚙ System Workflow

The system works in **five stages**.

---

# 🧱 Step 1 — Foundation Layer

### MERN + Capacitor

The first step is connecting the **React web interface with mobile device sensors**.

### React Frontend

A dashboard allows users to:

* Activate protection
* View wallet balance
* Track protection status

The app is converted to a mobile-compatible application using:

```
npx cap init
```

This allows the React application to access **native Android features**.

---

### Android Native Bridge

Standard web applications **cannot access battery temperature sensors**.

To solve this:

A **Java bridge** is implemented in:

```
android/app/src/main/java/.../MainActivity.java
```

This bridge reads:

```
Battery Temperature
Device State
Thermal Intents
```

---

### Data Flow

```
Android Sensor
     ↓
Java Bridge
     ↓
React App
     ↓
Node.js Backend
```

---

# 🔮 Step 2 — Climate Oracle

### Node.js + Python AI

To verify claims automatically, the system uses a **machine learning verification engine**.

---

## Node.js Backend

The server exposes a route:

```
POST /process-claim
```

When triggered:

1️⃣ React sends worker sensor data
2️⃣ Node receives the request
3️⃣ Node calls the **Python AI service**

---

## Python AI Service

The Python service is built using:

```
FastAPI
```

It runs a **Random Forest Model** trained to detect fraud patterns.

---

### Validation Logic

The model checks two parameters:

```
API Temperature (City Weather)
Battery Temperature (Device Sensor)
```

---

### Decision Formula

```
If API_Temp > 45°C
AND Battery_Temp > 42°C
→ Claim Valid
```

```
If API_Temp > 45°C
AND Battery_Temp < 30°C
→ Fraud Detected (AC Environment)
```

---

### Why This Works

If someone is indoors:

* Their phone temperature remains **cool**

If someone is outside in **47°C heat**:

* Phone temperature rises significantly.

---

# 💰 Step 3 — Weekly Premium System

### MongoDB + Cron Jobs

The system implements a **micro-insurance subscription model**.

Workers pay **₹29 per week** for protection.

---

## MongoDB User Schema

```json
{
  "user": "Rahul",
  "wallet_balance": 15030,
  "premium_paid_until": "2026-03-22",
  "active_shield": true
}
```

---

## Weekly Automation

A **Node.js Cron Job** runs every **Sunday at midnight**.

Logic:

```
IF wallet_balance >= 29
      deduct 29
      extend protection by 7 days
ELSE
      deactivate shield
```

---

### Cron Flow

```
Sunday Midnight
      ↓
Check Wallet
      ↓
Deduct Premium
      ↓
Extend Protection
```

---

# 📊 Step 4 — dot.exe Admin Dashboard

The **Admin Panel** demonstrates business viability.

Built using:

```
React + Recharts
```

---

## Dashboard Features

### 📈 Loss Ratio Graph

Shows profitability:

```
Premium Collected
        VS
Claims Paid
```

---

### 🚨 Fraud Counter

A visual display of blocked attempts.

Example:

```
Fridge Fraud Attempts Blocked: 27
```

This proves the AI system prevents abuse.

---

### 🗺 Live Worker Map

Using **React Leaflet**, admins can view locations where workers are protected.

Cities displayed:

* Delhi
* Bangalore

Each worker appears as a **map pin**.

---

# 🎬 Step 5 — Demo Strategy (Unicorn Pitch)

A compelling demo tells a **story**, not just code.

---

## Scenario

```
Location: Delhi
Time: 2 PM
Temperature: 47°C
Worker: Rahul
```

Rahul stops working due to dangerous heat.

---

## Demo Flow

### 1️⃣ Heat Detection

Python AI verifies extreme conditions.

```
API Temp → 47°C
Battery Temp → 44°C
```

Result:

```
Status: VALID CLAIM
```

---

### 2️⃣ Instant Payout

Refresh the dashboard.

Rahul's wallet increases:

```
+ ₹200
```

---

### 3️⃣ Fraud Attempt

A second user attempts to cheat.

Their data:

```
API Temp → 47°C
Battery Temp → 25°C
```

AI Result:

```
FRAUD DETECTED
(Indoor Environment)
```

The payout is **rejected**.

---

# 📈 Business Potential

KavachForWork demonstrates the potential for **AI-powered micro-insurance platforms**.

Benefits:

✔ Low-cost protection
✔ Instant payouts
✔ Fraud-resistant system
✔ Scalable architecture

This concept could scale to:

* **Gig workers**
* **Agricultural workers**
* **Delivery platforms**
* **Construction industries**

---

# 🔐 Future Improvements

Planned upgrades include:

* Satellite heat verification
* Blockchain claim transparency
* IoT wearable sensors
* Automated city risk prediction
* Government disaster integration

---


# 🛡️ NEW UPDATE

## ⚠️ Adversarial Defense & Anti-Spoofing Strategy

### 🚨 Critical Upgrade: GPS is no longer trusted alone

A coordinated fraud attack using GPS spoofing can drain the system.



### 🎯 1. Differentiation Strategy
 Multi-Signal Verification Model

```
Claim Score = f(
  GPS +
  Battery Temp +
  Motion +
  Network +
  Behavior History
)
```

### ✅ Genuine Worker

* High temperature 🔥
* Movement detected 🚶
* Mobile data usage 📶
* Natural fluctuations

### 🚨 Fraudster

* Low battery temp ❄️
* Static movement 🛑
* WiFi usage 🏠
* Repeated patterns 🔁

### 📊 2. Data Intelligence Layer
 Signals Used
### 📱 Device Data
* Battery temp
* CPU load
* Sensor activity

### 🌍 Environment
* Weather API
* Time of day

### 🚶 Behavior
* Movement
* Speed
* Session activity

### 🌐 Network
* IP patterns
* WiFi vs Mobile

### 🕵️ Fraud Ring Detection
```
IF multiple users:
   same location +
   same timing +
   same pattern
### → 🚨 MASS FRAUD DETECTED
```

### 🤖 AI Risk Scoring
Each claim gets:
### Fraud Score (0–100)

| Score                   | Action          |
| ----------------------- | ----------------|
| **0 - 30**              | ✅ Approve      |
| **30 - 70**             | 🟡 Flag         |
| **70 - 100**            | 🚨 Reject       |

### ⚖️ 3. UX Balance Strategy
Smart Claim Handling

| Status                  | Meaning        |
| -----------------------| ----------------|
| **✅ Approved**        | Instant payout  |
| **🟡 Flagged**         | Under review    |
| **🚨 Rejected**        | Fraud           |

### 🛠 Flow

```
Flagged Claim
     ↓
Temporary Hold
     ↓
Re-evaluation
     ↓
Final Decision
```

### Design Principle
✔ Protect genuine users
✔ Avoid unfair rejection
✔ Maintain trust

### 🧠 Final Defense Architecture

    GPS ❌ (Not trusted alone)
              ↓
    Multi-Signal Verification
              ↓
     AI Risk Engine
              ↓
     Decision System
      ┌──────┬────────┐
      ↓      ↓        ↓
    Approve  Flag    Reject


# 👩‍💻 Team

**Team dotExe**

Building next-generation **InsurTech solutions** to protect vulnerable workers using **AI + Climate Data + Mobile Technology**.

---

# ⭐ Vision

Our vision is to create **India’s first real-time climate protection system for workers**.

> *When heat rises, protection should activate automatically.*


