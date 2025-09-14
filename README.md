# 🏗️ BitCraft Project Planner & Recipe Calculator

[![Remix](https://img.shields.io/badge/Remix-000?logo=remix&logoColor=white)](https://remix.run)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-319795?logo=chakraui&logoColor=white)](https://chakra-ui.com)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com)

**The ultimate companion app for BitCraft Online builders, crafters, and empire architects.** 

Stop alt-tabbing to spreadsheets. Stop guessing what materials you need. Start building your BitCraft empire with data-driven precision.

## ✨ Features

### 🎯 Smart Recipe Calculator
- **Inventory-Aware Calculations**: Automatically deducts what you already have from recipe requirements
- **Deep Recipe Breakdown**: Recursively calculates all materials needed, from raw resources to complex components
- **Tier Optimization**: Groups materials by tier for efficient gathering strategies
- **Deficit Tracking**: Instantly see what you're missing and how much

### 📦 Unified Inventory Management
- **Multi-Source Tracking**: Monitor personal inventories, banks, storage, recovery stashes, and claim buildings
- **Live Data Integration**: Pulls real-time inventory data from BitJita API
- **Cross-Character Support**: Manage multiple characters and claims from one dashboard
- **Persistent Selections**: Your tracked inventories persist across sessions

### 🏰 Claim Management
- **Building Inventories**: Access all storage buildings in your claims
- **Claim Switching**: Easily switch between multiple claims
- **Consolidated View**: See all claim resources in one place

### 🔍 Intelligent Search
- **Player Lookup**: Find any BitCraft player by name
- **Item Database**: Search through the complete BitCraft item catalog
- **Recipe Discovery**: Explore crafting and extraction recipes

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- Git (with submodule support)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bitcraft-planner.git
cd bitcraft-planner

# Initialize GameData submodule
git submodule update --init --recursive

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` and start planning your BitCraft empire!

### Production Build

```bash
# Build for production
npm run build

# Run production server (Netlify)
npm start
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Chakra UI with Emotion CSS-in-JS
- **Framework**: Remix with Vite (SSR)
- **Data Sources**: 
  - BitCraft GameData (authoritative items/recipes)
  - BitJita API (live player/claim data)
- **Deployment**: Netlify Functions
- **Language**: TypeScript with ESM

### Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard with tracked inventory aggregation |
| `/inventory` | Personal inventory manager |
| `/claim-inventories` | Claim building inventory manager |
| `/recipes` | Recipe calculator with inventory integration |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/players?q=...` | Search players by name |
| `GET /api/player/:id` | Get player details (cached 5min) |
| `GET /api/player/:id/inventories` | Fetch player inventories |
| `GET /api/claims/:id/inventories` | Get claim building inventories |
| `POST /api/recipes/calculate` | Calculate recipe requirements |

## 🎮 How It Works

### Recipe Calculation Engine
The heart of the app is a sophisticated recipe calculator that:
1. **Recursively breaks down** complex recipes into base materials
2. **Cross-references** your combined inventory (personal + claims)
3. **Calculates exact deficits** showing what you need to gather
4. **Optimizes by tier** for efficient resource gathering

### Inventory Aggregation
The system intelligently combines inventories from multiple sources:
- Personal pockets and bags
- Bank vaults
- Storage containers
- Recovery stashes
- All buildings in your selected claim

### Data Flow
```
BitCraft GameData (Submodule) ─┐
                                ├─→ Recipe Engine ─→ Calculations
BitJita API (Live Data) ────────┘
```

## 🔧 Configuration

### Environment Variables

```bash
# Server-side
BITJITA_BASE_URL=https://bitjita.com  # BitJita API endpoint
RECIPE_DEBUG=1                         # Enable verbose recipe logs

# Development
npm run dev                            # Start dev server
npm run typecheck                      # TypeScript validation
npm run test:recipes                   # Test recipe calculations
```

### Security
- Strict Content Security Policy
- Connect-src limited to BitJita API
- No authentication required (public data only)
- 10-second timeout on external API calls

## 🤝 Contributing

Contributions are welcome! The BitCraft community thrives on collaboration.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing
```bash
npm run test:data          # Test GameData parsing
npm run test:search        # Test search functionality
npm run test:recipes       # Test recipe calculations
```

## 📊 Performance

- **Smart Caching**: Player data cached for 5 minutes
- **Debounced Search**: Reduces API calls during typing
- **Lazy Loading**: Route components loaded on demand
- **Optimized Aggregation**: Efficient inventory combining algorithms

## 🎯 Roadmap

- [ ] Tier substitution optimization (upgrade/downgrade materials)
- [ ] Batch crafting calculator
- [ ] Material sourcing suggestions
- [ ] Guild inventory sharing
- [ ] Market price integration
- [ ] Mobile-responsive design improvements
- [ ] Export to CSV/spreadsheet

## 🙏 Acknowledgments

- **Clockwork Labs** for creating BitCraft Online and open-sourcing their vision
- **BitJita** for providing the live data API
- **BitCraft Community** for the endless inspiration and feedback
- **SpacetimeDB** for revolutionizing MMO architecture

## 📜 License

This project uses BitCraft game assets for non-commercial informational purposes under fair use. BitCraft Online and all related trademarks belong to Clockwork Labs, Inc.

The application source code is available under [The Unlicense](LICENSE).

---

*Built with ⚒️ by the BitCraft community, for the BitCraft community.*

*Happy crafting, and may your hexite mines never run dry!* 🎮✨