# OmniLLM

A modern, dark‑mode‑first web app built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Zustand**, and **lucide-react**.

## Getting Started

```bash
npm i          # install dependencies
npm run dev    # start the development server (http://localhost:3000)
```

The app includes:
- A responsive sidebar navigation (Dashboard, API Keys, Local Hub)
- A chat UI with model selector, message list and simulated streaming response
- Global state management with Zustand
- Dark mode toggle (default is dark mode)

## Project Structure
```
src/
  app/
    layout.tsx            # global layout with sidebar and dark‑mode toggle
    dashboard/
      page.tsx           # dashboard page
    chat/
      page.tsx           # chat UI page
    api-keys/
      page.tsx           # placeholder page
    local-hub/
      page.tsx           # placeholder page
  components/
    Sidebar.tsx          # sidebar navigation component
    ModelSelector.tsx    # model selector dropdown
    ChatMessage.tsx       # individual chat bubble component
  store.ts                # Zustand store for model and messages
next.config.js
tailwind.config.js
postcss.config.js
```