# Quickstart — Deploy ApiForge to Azure Static Web Apps

## 1. Prerequisites
- Azure subscription with permissions to create Static Web Apps + Application Insights.
- GitHub repository access with Actions enabled.
- Node.js 18 LTS, npm 10, Azure Functions Core Tools v4, and Azure Static Web Apps CLI installed locally.
- Azure CLI logged in (`az login`).

## 2. Provision the Static Web App
1. Run `az staticwebapp create` (or use the portal) with:
   - `--name apiforge-<env>`
   - `--location eastus2` (or closest region with Functions support)
   - `--source https://github.com/sharesmallbiz-support/ApiForge`
   - `--branch 001-azure-static-app`
   - `--login-with-github`
2. Record the generated `AZURE_STATIC_WEB_APPS_API_TOKEN` secret for GitHub Actions.

## 3. Configure repository secrets
Add the following Actions secrets (per environment if needed):
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `SWA_PREVIEW_EXECUTOR_API_KEY`
- `SWA_PRODUCTION_EXECUTOR_API_KEY`
- Any upstream system credentials (e.g., OpenAI keys) mapped to logical names referenced by `SecretBinding`.

## 4. Prepare the Functions backend
1. Duplicate `server/` logic into `api/` (Azure Functions convention) using the planned HTTP triggers.
2. Install dependencies inside `api/` (`npm install`).
3. Run locally with `swa start http://localhost:4173 --run "npm run dev:functions"` to exercise the hosted execution path while keeping the client in dev mode.

## 5. Set up GitHub Actions workflow
1. Add `.github/workflows/azure-static-web-app.yml` with two jobs:
   - **build-test**: installs dependencies, runs `npm run check`, `npm run test`, and uploads `client/dist` + `api/` artifacts.
   - **deploy**: downloads artifacts and calls `Azure/static-web-apps-deploy@v2` twice (preview on PRs, production on `main`).
2. Require the workflow check for all PRs touching `client`, `server`, or `shared`.

## 6. Verify preview deployments
- Open the preview URL posted by the Action.
- Execute a request using existing workspace data; confirm the Azure Function response matches local output and that DebugPanel links to Application Insights traces.

## 7. Promote to production
- Merge the PR; the workflow redeploys to the production slot using the recorded commit SHA.
- Validate custom domains and HTTPS bindings before announcing availability.

## 8. Monitor and rollback
- Review Application Insights dashboards and Azure Monitor alerts configured for latency/error rate.
- To rollback, redeploy the previous artifact by re-running the GitHub Action with the earlier commit SHA or using SWA environment promotion history.
