# Developer Setup & Contributor Guide
## TelcoQualify Enterprise Presales Platform

---

### 1. Prerequisites
- **Node.js**: v18.18+ or v20.x / v22.x / v24.x (Tested on Node.js v24.x LTS)
- **Package Manager**: npm 9+ or pnpm 8+
- **Git**: 2.30+
- **Docker** (Optional for local dev; required for containerized staging/prod)

---

### 2. Quickstart (Zero-Configuration Local Setup)

```bash
# 1. Clone the repository
git clone <repository-url>
cd "Project 1"

# 2. Install dependencies
npm install

# 3. Initialize Environment
cp .env.example .env.local

# 4. Start Development Server
npm run dev
```

The web platform will be accessible at: `http://localhost:3000`

---

### 3. Essential Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Next.js full-stack development server with hot-reload |
| `npm run build` | Compiles production assets and server bundles |
| `npm run start` | Starts the compiled production application |
| `npm run lint` | Runs ESLint and static code analysis |
| `npm run typecheck` | Runs strict TypeScript compiler check (`tsc --noEmit`) |
| `npm run test` | Runs unit and integration test suites using Vitest |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | Generates detailed test coverage reports |
| `npm run seed` | Seeds demo customers, catalog items, and mock solution cases |

---

### 4. Code Standards & Architecture Guidelines
1. **Clean Architecture**: Place domain logic in `src/core/domain` and `src/core/qualification`. UI components belong in `src/components`.
2. **Never Hardcode Strings**: Always add translations to both `src/lib/i18n/en.ts` and `src/lib/i18n/fr.ts`.
3. **Strict Validation**: Validate all inbound payloads with Zod schemas before touching business services.
4. **Audit Logging**: Any state change or administrative action must call `AuditService.logEvent()`.
