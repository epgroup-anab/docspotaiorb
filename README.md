# Docspot AI

Single-agent ElevenLabs voice web app based on the SolarStyle project.

## Configure the agent

1. Open `src/config/agent.ts`
2. Replace `REPLACE_WITH_YOUR_AGENT_ID` with your ElevenLabs agent ID.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build / deploy

```bash
npm run build
npx netlify-cli deploy --build --prod
```
