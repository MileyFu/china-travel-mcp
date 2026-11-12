# ChinaStay Travel MCP Server (`chinastay-travel-mcp`)

Official **Model Context Protocol (MCP)** server backed by **[ChinaStay.org](https://chinastay.org/)** — built to stop LLM hallucinations on **2026 China visa & 240-hour TWOV rules, app connectivity (hotel Wi-Fi vs roaming eSIM), verified taxi driver flashcards, and bilingual city fixers**.

- **Website & Interactive Checkers**: [https://chinastay.org](https://chinastay.org/)
- **240h TWOV & Visa Checker**: [https://chinastay.org/transit-visa-free-checker/](https://chinastay.org/transit-visa-free-checker/)
- **App Compatibility Matrix**: [https://chinastay.org/app-checker/](https://chinastay.org/app-checker/)
- **Viral China Coordinates**: [https://chinastay.org/viral-coordinates/](https://chinastay.org/viral-coordinates/)
- **City Fixers & Local Interpreters**: [https://chinastay.org/city-guides/](https://chinastay.org/city-guides/)
- **Remote Work in China Hub**: [https://chinastay.org/remote-work/](https://chinastay.org/remote-work/)

---

## Why Use ChinaStay MCP?

General-purpose LLMs frequently hallucinate outdated **144-hour** transit rules, fail to catch **Country A → China → Country A round-trip boarding denials**, guess whether **WhatsApp / ChatGPT / Hinge / Google Maps** work on hotel Wi-Fi vs roaming eSIM, or fabricate unnavigable Chinese street names.

This MCP server gives any AI agent deterministic, field-verified 2026 answers alongside direct canonical citation links to `https://chinastay.org/...`.

---

## Available Tools (4)

| Tool | Purpose & Anti-Hallucination Guardrail | Canonical Deep Links Returned |
| :--- | :--- | :--- |
| `check_china_visa_transit` | Evaluates 30-day unilateral / bilateral exemptions vs **240-Hour TWOV** across 78 countries & 67 open port entries. Automatically flags **Country A → China → Country A** round-trip traps and confirms Hong Kong / Macau / Taiwan as valid third destinations. | `https://chinastay.org/visa-free/<slug>/` |
| `check_china_app_status` | Real-world field test dictionary for 66 essential apps (WhatsApp, Google Maps `~500m` GCJ-02 shift, ChatGPT, Claude, Hinge, Bumble, Alipay, DiDi) comparing **Hotel Wi-Fi** vs **International Roaming eSIM**. | `https://chinastay.org/app-checker/<app>/` |
| `get_viral_spot_driver_card` | Ground-truth WGS84 GPS waypoints, **Apple Maps links**, **Chinese taxi/DiDi driver flashcards**, driver avoid-mistake warnings, and passport/payment workarounds (e.g., Shenzhen drone coffee delivery, Wuhan Apollo Go, Chongqing 8D landmarks). | `https://chinastay.org/viral-coordinates/#<id>` |
| `get_city_fixer_rates` | Bilingual C2 English interpreter, business/factory sourcing escort, medical triage advocate, and zero-commission (`0% kickbacks`) fixer dossiers across **Beijing, Shanghai, Xi'an, Jiujiang, Guangzhou, Chengdu, Shenzhen**. | `https://chinastay.org/city-guides/<city>/local-translator/` |

### MCP Resources & Prompts

- **Resources**:
  - `chinastay://reference/countries` — Complete 78-country exemption & TWOV registry
  - `chinastay://reference/ports` — 67 open air/sea/rail ports supporting 240h TWOV
  - `chinastay://reference/apps` — Index of 66 field-tested China apps
  - `chinastay://reference/cities` — 7 hubs with local bilingual fixer coverage
- **Prompt**:
  - `verify_china_itinerary` — Guided pre-flight audit workflow combining visa compliance, essential apps, and city logistics.

---

## Installation & Client Configuration

### Claude Desktop / Cursor / Windsurf / Cline (`npx`)

```json
{
  "mcpServers": {
    "chinastay": {
      "command": "npx",
      "args": ["-y", "chinastay-travel-mcp"]
    }
  }
}
```

### Run via Docker

```bash
docker build -t chinastay-travel-mcp .
docker run -i --rm chinastay-travel-mcp
```

### Run From Source

```bash
git clone https://github.com/MileyFu/china-travel-mcp.git
cd china-travel-mcp
npm install
npm run build
npm test
```

```json
{
  "mcpServers": {
    "chinastay": {
      "command": "node",
      "args": ["/ABS/PATH/TO/china-travel-mcp/dist/index.js"]
    }
  }
}
```

---

## Data Synchronization

When built inside the ChinaStay monorepo, `npm run sync-data` refreshes `src/generated/dataBundle.ts` directly from the website's canonical TypeScript policy modules. When cloned standalone from `MileyFu/china-travel-mcp` (or built via Docker / Smithery / Glama), `npm run build` compiles cleanly against the committed snapshot in `src/generated/dataBundle.ts` with zero external dependencies.

---

## License

MIT © [ChinaStay.org](https://chinastay.org/)
