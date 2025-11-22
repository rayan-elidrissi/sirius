## Sirius Data Layer – Walrus Hackathon Project

Sirius is a data-layer service that gives **verifiable version history** for datasets stored on **Walrus**, plus a React dashboard to explore them.

## Business use case

Regulated teams (banks, health, AI safety, public sector) need to **prove what data an AI system saw and when**, without putting every update on-chain. Sirius turns raw Walrus blobs into an **auditable data ledger**: every dataset change is fingerprinted, signed, and chained so you can answer, in seconds, “**who changed which data, when, and what did it contain?**”

This lets you:
- **Pass audits faster** – export a cryptographically verifiable change history instead of manual evidence gathering  
- **Reduce risk** – detect tampering or shadow changes to sensitive datasets  
- **Sell trust** – give your customers and regulators a transparent view into how their data is used by your AI systems  

## Repo structure

- **`Backend/`** – Node.js/TypeScript service, CLI, SQLite/Prisma data layer  
- **`Frontend/`** – React + TypeScript + Tailwind dashboard (Vite)

## More details

- Backend design and CLI: `Backend/README.md`  
- Frontend details: `Frontend/README.md`  
- Docs used in the app: `Frontend/src/docs/`
