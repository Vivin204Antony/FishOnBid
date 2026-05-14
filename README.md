# 🐟 FishOnBid — A GenAI Orchestrated Auction Platform

> **A real-time fish auction platform that uses Generative AI to help fishermen sell their catch faster, fairer, and smarter.**

---

## 📌 What is FishOnBid?

In India, coastal fish auctions still happen manually — an auctioneer shouts prices, buyers gather around the catch, and everything runs on guesswork. There's no data, no transparency, and the whole process takes 15–25 minutes per lot.

**FishOnBid replaces this with a digital platform where:**

1. A fisherman **takes a photo** of his catch
2. **AI identifies the fish species**, scores its freshness, and grades the quality — automatically
3. The system **suggests a fair price** using past auction data + live government market rates
4. The auction goes **live online** — anyone can bid from anywhere, in real time
5. The **highest bidder wins**, with every bid recorded and auditable

**In short:** Photo → AI Analysis → Smart Pricing → Live Auction → Winner. All in under a minute.

---

## 🧠 How Does the AI Work?

FishOnBid has three AI components that work together:

### 1. GenAI Vision Service (Species & Freshness Detection)

When a seller uploads a fish photo, it's sent to **Google Gemini 1.5 Flash** — a multimodal AI model. The AI acts like a marine biologist and returns:

- **Species name** (e.g., "Seer Fish", "Pomfret")
- **Freshness score** (0–100)
- **Quality grade** (PREMIUM, GOOD, ACCEPTABLE, or LOW)
- **Confidence level** (how sure the AI is)

This auto-fills the auction form — the fisherman doesn't need to type anything. This is especially helpful for users who may not be comfortable with technology.

> **No training data needed.** Unlike traditional CNN models that require thousands of labelled images, Gemini works "zero-shot" — it understands fish from its general knowledge.

### 2. RAG Retrieval Service (Finding Similar Past Auctions)

RAG stands for **Retrieval-Augmented Generation**. Instead of guessing prices, the system looks at what happened before:

- Every past auction is stored as a **5-dimensional vector** (fish type, location, price, quantity, recency)
- When a new auction is created, the system **searches for the most similar past auctions** from the last 90 days
- This search uses **cosine similarity** — a mathematical way to find "closest matches"
- The vector store is **refreshed every hour** so it always has the latest data

### 3. AI Pricing Engine (Trust-Weighted Price Prediction)

The pricing engine combines two data sources to suggest a fair price:

| Source | Weight | What it provides |
|--------|--------|------------------|
| Platform auction history | 70% | What this fish actually sold for on FishOnBid |
| Government Fisheries API (data.gov.in) | 30% | Official mandi market rates across India (77M+ records) |

The system then:
- Applies a **freshness multiplier** (fresher fish = higher price, stale fish = lower price)
- Outputs a **suggested price with a ±10% confidence band** (e.g., ₹850/kg, range ₹765–₹935)
- **Logs every decision** (inputs, weights, sources, output) into the `AiDecisionLog` table for full transparency

**Trust-weighted formula in plain English:** Recent data from official government sources is trusted more than old data from a small number of auctions. The more data we have, the more confident the prediction.

---

## ⚡ Real-Time Bidding — How It Works

Once an auction is published, buyers can bid on it live:

1. **WebSocket connection** — When a buyer opens an auction page, their browser connects to the server via WebSocket (STOMP protocol). This means new bids appear instantly — no page refresh needed.

2. **Pessimistic Locking** — The biggest risk in any online auction is two people bidding at the exact same moment. FishOnBid prevents this by **locking the auction row in the database** before processing each bid. Only one bid is processed at a time — zero chance of data corruption.

3. **Fairness Rules:**
   - A buyer can win **maximum 5 auctions per week** (prevents monopoly)
   - After winning, there's a **30-second cooldown** before they can win again
   - Bids must be **higher than the current price** (validated server-side)

4. **Auto-close** — When the auction timer expires, it closes automatically and the highest bidder is declared the winner.

---

## 🏗 Project Structure

```
FishOnBid/
│
├── Backend/                          # Spring Boot Backend (Java 21)
│   └── src/main/java/com/FishOnBid/FishOnBid_Backend/
│       ├── FishOnBidApplication.java # Main entry point
│       ├── ai/                       # AI modules
│       │   ├── vision/               # GenAI Vision Service (Gemini integration)
│       │   ├── rag/                  # RAG Retrieval Service (vector embeddings)
│       │   ├── service/              # AI Pricing Engine & Orchestrator
│       │   ├── controller/           # AI API endpoints
│       │   ├── dto/                  # AI data transfer objects
│       │   ├── entity/               # AiDecisionLog entity
│       │   └── repository/           # AI data persistence
│       ├── controller/               # REST API controllers (Auth, Auction, Bid)
│       ├── service/                  # Business logic (AuctionService, CloudinaryService)
│       ├── entity/                   # Database entities (User, Auction, Bid)
│       ├── repository/               # JPA repositories with pessimistic locking
│       ├── dto/                      # Request/Response DTOs
│       ├── config/                   # Security, CORS, WebSocket config
│       ├── websocket/                # WebSocket message broadcasting
│       ├── events/                   # Application event handlers
│       └── util/                     # JWT utility, helpers
│
├── src/                              # React 19 Frontend
│   ├── App.jsx                       # Main app with routing
│   ├── main.jsx                      # React entry point
│   ├── pages/                        # Page components
│   │   ├── Home.jsx                  # Landing page
│   │   ├── Login.jsx                 # User login
│   │   ├── Signup.jsx                # User registration
│   │   ├── Auctions.jsx             # Browse all auctions
│   │   ├── AuctionDetail.jsx        # Single auction with live bidding
│   │   └── Dashboard.jsx            # User dashboard
│   ├── components/                   # Reusable UI components
│   │   ├── Header.jsx               # Navigation header
│   │   ├── AuctionCard.jsx          # Auction listing card
│   │   ├── ProtectedRoute.jsx       # Auth route guard
│   │   └── OfflineBanner.jsx        # PWA offline indicator
│   ├── api/                          # Axios API service layer
│   └── context/                      # React context (auth state)
│
├── research-paper/                   # Research paper & diagrams
├── index.html                        # HTML entry point
├── vite.config.js                    # Vite build configuration
├── tailwind.config.js                # Tailwind CSS configuration
└── package.json                      # Frontend dependencies
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework — component-based, reactive |
| Vite | 7.2 | Fast build tool and dev server |
| Tailwind CSS | 3.4 | Utility-first CSS for responsive design |
| React Router | 7.9 | Client-side page routing |
| Axios | 1.13 | HTTP client for API calls |
| PWA (vite-plugin-pwa) | 1.2 | Offline support and installability |
| STOMP/SockJS | — | WebSocket client for real-time bid updates |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 3.5.7 | Java web framework — handles all server logic |
| Java | 21 | Programming language |
| Spring Security + JWT | — | Authentication and authorization |
| Spring Data JPA | — | Database access with pessimistic locking |
| Spring WebSocket | — | Real-time bid broadcasting (STOMP) |
| Spring WebFlux | — | Non-blocking HTTP client for external APIs |
| Resilience4j | 2.2 | Circuit breakers — prevents cascading failures |
| Lombok | — | Reduces boilerplate code |
| Spring Actuator | — | Health monitoring endpoints |

### Database & External Services
| Technology | Purpose |
|-----------|---------|
| MySQL 8.0 | Primary database — stores users, auctions, bids, AI logs |
| Google Gemini 1.5 Flash | Multimodal AI — species detection, freshness scoring |
| data.gov.in APIs | Government fisheries market prices (77M+ records) |
| Cloudinary | Cloud storage for auction images and videos |

---

## 👥 User Roles

FishOnBid has three types of users:

| Role | What they can do |
|------|-----------------|
| **Seller (Fisherman)** | Take fish photo → AI analysis → Set price → Create auction |
| **Buyer (Bidder)** | Browse auctions → Place bids in real-time → Win auctions |
| **Admin** | Manage users → Oversee all auctions → View platform analytics |

---

## 🔄 End-to-End User Flow

### For a Seller (Fisherman):
```
Open App → Login → Tap "New Auction" → Capture Fish Photo
    → AI identifies species + freshness (auto-filled)
    → Tap "Get AI Price" → System suggests fair price
    → Confirm & Publish → Auction goes live
    → Buyers bid in real-time → Timer expires → Winner announced
```

### For a Buyer:
```
Open App → Login → Browse Auctions (filter by fish type, location, freshness)
    → Open an auction → See live bids updating in real-time
    → Place a bid (must be higher than current price)
    → If highest when timer ends → You win!
```

---

## 📊 Performance Results

| Metric | Target | Achieved |
|--------|--------|----------|
| Species detection accuracy | 85% | **91%** ✅ |
| Freshness scoring accuracy | 80% | **87%** ✅ |
| Price prediction deviation | <15% | **8.3%** ✅ |
| Concurrent bid safety | Zero corruption | **0 failures in 50 simultaneous bids** ✅ |
| Listing time (with Snap & Bid) | <2 min | **~30 seconds** ✅ |

---

## 🔧 Installation & Setup

### Prerequisites

- **Java 21** — [Download](https://adoptium.net/)
- **Node.js 18+** & npm — [Download](https://nodejs.org/)
- **MySQL 8.0+** — [Download](https://dev.mysql.com/downloads/)
- **Maven** (or use the included `mvnw` wrapper)
- **Google Gemini API Key** — [Get one](https://makersuite.google.com/app/apikey) (optional — the app works with a mock fallback if not configured)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Vivin204Antony/FishOnBid.git
cd FishOnBid
```

### Step 2: Setup MySQL Database

```sql
CREATE DATABASE fishonbid;
```

Update the database credentials in `Backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fishonbid
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Step 3: Run the Backend

```bash
cd Backend
./mvnw spring-boot:run
```

The backend starts at `http://localhost:8080`

### Step 4: Run the Frontend

```bash
# From the project root (not Backend/)
cd ..
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`

### Step 5: Open the App

Open `http://localhost:5173` in your browser. Sign up, create an auction, and start bidding!

---

## 🔑 API Endpoints (Key ones)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auctions` | List all active auctions |
| POST | `/api/auctions` | Create a new auction (seller) |
| POST | `/api/auctions/{id}/bid` | Place a bid on an auction |
| GET | `/api/auctions/{id}` | Get auction details |
| POST | `/api/ai/vision/analyze` | Analyze fish image with GenAI |
| POST | `/api/ai/pricing/suggest` | Get AI-suggested price |
| WS | `/ws` → `/topic/auction/{id}` | Real-time bid updates via WebSocket |

---

## 🔬 Research Paper

This project is also the subject of an academic research paper:

**"Use of Generative AI and Retrieval-Augmented Generation in Modern Applications: A Prediction-Based Study with the FishOnBid Auction Platform"**

- **Author:** Antony Vivin S (24MX204)
- **Guide:** Ms. A Bhuvaneswari, Assistant Professor
- **Institution:** Department of Computer Applications, PSG College of Technology, Coimbatore
- **Domain:** Use of Generative AI in Different Applications

The full paper is available in the [`research-paper/`](./research-paper/) directory.

---

## 🚀 What Makes FishOnBid Different?

| Existing Systems | FishOnBid |
|-----------------|-----------|
| Manual pricing by auctioneer guesswork | AI-powered pricing grounded in real market data |
| CNN models need thousands of labelled images | Zero-shot detection — no training data needed |
| No explanation for suggested prices | Every prediction is logged and explainable |
| No remote participation possible | Anyone can bid from anywhere, in real time |
| 15–25 minutes to list one lot | ~30 seconds with Snap & Bid |
| No concurrency safety | Pessimistic locking — zero data corruption |

---

## 📄 License

This project is developed as part of the MCA program at PSG College of Technology, Coimbatore.

**Author:** Antony Vivin S | **Guide:** Ms. A Bhuvaneswari

---

*Built with ❤️ for Indian fishing communities*
