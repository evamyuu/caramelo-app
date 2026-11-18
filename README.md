![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Detection-0097A7)
![License](https://img.shields.io/badge/License-MIT-green)

<!-- Banner: add docs/banner.png and uncomment -->
<!-- ![Caramelo](docs/banner.png) -->

# 🐕 Caramelo App

> The guard dog that lives in grandma's phone. Caramelo is the interface: it speaks first, does things together with the user and always asks permission.

Mobile web client of **Caramelo**, an assistant that protects and helps older adults in Brazil. Built for the FIAP Global Solution 2026 (CitizenTech). The backend lives in [`caramelo-api`](https://github.com/evamyuu/caramelo-api).

## 📖 About

Each screen follows one fixed structure taken from the design: a context chip, one large sentence, Caramelo's speech, at most two actions, and Caramelo at the bottom with a voice hint. The background colour changes with Caramelo's state (calm, listening, scam alert, waiting for permission, done).

| Flow | What runs for real | Where |
| --- | --- | --- |
| Link in an isolated room | The API opens the link in a disposable browser and returns a verdict | `features/guard` |
| Do it together | Live co-browsing over WebSocket, consent before sensitive steps, password typed only by the user | `features/cobrowse` |
| Guided selfie | On-device face detection (MediaPipe). No image leaves the phone | `features/documents` |
| Medicine reader | On-device OCR (tesseract.js). Reads the label, never interprets dosage | `features/companion` |
| Suspicious call | Risk score from the API. The incoming call itself is simulated | `features/guard` |
| Bank balance | Simulated Open Finance payload, read only | `features/companion` |

User-facing text is Brazilian Portuguese by product design. Code and documentation are in English.

## 🏗️ Architecture

```
src/
├── app/            Composition root: screen registry and navigation
├── components/     Reusable UI: Screen layout, Avatar, Checklist, Icon
├── features/       One folder per product module (screen + its hooks and pure logic)
│   ├── home/         Home, apps grid, voice listening
│   ├── guard/        Scam protection: message link scan, call alert
│   ├── cobrowse/     Secure session: WebSocket hook, live view, phases
│   ├── documents/    Guided selfie and its framing rules
│   └── companion/    Medicine reader, bank balance
├── hooks/          Cross-feature hooks (camera)
├── lib/            API client, speech, shared types
└── styles/         Design tokens (moods) and global styles
```

Conventions:

- **Feature-first folders.** A feature owns its screens, hooks and logic; shared code moves to `components`, `hooks` or `lib` only when a second feature needs it.
- **Pure logic is separated from I/O** (`faceGuidance.ts`, `legibleWords`, the session reducer) and unit tested.
- **One layout component.** Every screen renders through `Screen`, so structure and accessibility stay consistent.
- **Design tokens.** Colours come from `styles/tokens.css`; a screen only declares its `mood`.

## 🛠️ Technologies

- **React 18 + TypeScript (strict)**: UI and type safety
- **Vite**: dev server and build
- **MediaPipe Tasks Vision**: face detection in the browser
- **tesseract.js**: OCR in the browser
- **Web Speech API**: voice in and out (pt-BR)
- **Vitest**: unit tests

## 🚀 How to Run

Prerequisites: Node.js 20+ and [`caramelo-api`](https://github.com/evamyuu/caramelo-api) running on port 8000.

```bash
git clone https://github.com/evamyuu/caramelo-app.git
cd caramelo-app
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck and production build |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript only |

Camera and microphone need HTTPS or `localhost`. To test on a phone, expose the dev server through an HTTPS tunnel and set `VITE_API_URL` to the API's public URL.

## 🤝 How to Contribute

1. Create a branch: `git checkout -b feat/short-description`
2. Follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`)
3. Run `npm run typecheck && npm test` before opening a pull request

## 👥 Team

| [<img src="https://github.com/evamyuu.png" width="80" alt="evamyuu" />](https://github.com/evamyuu) |
| :---: |
| [evamyuu](https://github.com/evamyuu) |

## 📄 License

[MIT](LICENSE)

---

Made with 🤎 by the Caramelo team
