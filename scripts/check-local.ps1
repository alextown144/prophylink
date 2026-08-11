$ErrorActionPreference = "Stop"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available on PATH. Install Node.js 20+ before running local checks."
}

npm run lint
npm run typecheck
npm run test
npm run build
