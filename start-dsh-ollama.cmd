@echo off
setlocal

set ROOT=%~dp0
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%

set DSH_HOME=%ROOT%\.dsh-ollama
set npm_config_manage_package_manager_versions=
if "%OLLAMA_API_KEY%"=="" set OLLAMA_API_KEY=ollama
if "%OLLAMA_MODEL%"=="" set OLLAMA_MODEL=qwen2.5-coder:14b-instruct
if "%OLLAMA_URL%"=="" set OLLAMA_URL=http://127.0.0.1:11434/v1

mkdir "%DSH_HOME%" 2>nul
(
  echo llm-pi-ai:
  echo   providers:
  echo     openai:
  echo       apiKeyEnv: OLLAMA_API_KEY
  echo       api: openai-completions
  echo       baseURL: %OLLAMA_URL%
  echo       compat:
  echo         supportsDeveloperRole: false
  echo         maxTokensField: max_tokens
  echo         thinkingFormat: qwen
  echo       models:
  echo         - id: %OLLAMA_MODEL%
  echo           input: [text]
  echo           contextWindow: 32768
  echo           maxTokens: 4096
  echo agent-default-model:
  echo   provider: openai
  echo   model: %OLLAMA_MODEL%
) > "%DSH_HOME%\settings.yaml"

if defined NODE_HOME set "PATH=%NODE_HOME%;%PATH%"

cd /d "%ROOT%"
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not found on PATH.
  echo Set NODE_HOME to a portable Node installation or install pnpm globally.
  exit /b 1
)

if not exist "%ROOT%\apps\web\dist\index.html" (
  echo Building deepseek-harness web frontend and libraries [pnpm run build]...
  pnpm run build
)

set EXTRA_PATCHES=
if "%1"=="--life" set EXTRA_PATCHES=--patch "%ROOT%\overlays\01-life-management.patch.yml"
if "%1"=="--commerce" set EXTRA_PATCHES=--patch "%ROOT%\overlays\02-ecommerce-arbitrage.patch.yml"
if "%1"=="--finance" set EXTRA_PATCHES=--patch "%ROOT%\overlays\03-financial-autonomy.patch.yml"
if "%1"=="--devops" set EXTRA_PATCHES=--patch "%ROOT%\overlays\04-enterprise-devops.patch.yml"
if "%1"=="--marketing" set EXTRA_PATCHES=--patch "%ROOT%\overlays\05-growth-marketing.patch.yml"
if "%1"=="--ai" set EXTRA_PATCHES=--patch "%ROOT%\overlays\06-ai-multimodal-infra.patch.yml"
if "%1"=="--creative" set EXTRA_PATCHES=--patch "%ROOT%\overlays\07-creative-endeavor.patch.yml"
if "%1"=="--integrations" set EXTRA_PATCHES=--patch "%ROOT%\overlays\all-integrations.patch.yml"
if "%1"=="-integrations" set EXTRA_PATCHES=--patch "%ROOT%\overlays\all-integrations.patch.yml"

pnpm dsh --profile web --patch "%ROOT%\ollama-headless.patch.yml" --patch "%ROOT%\hardware-monitor-windows.patch.yml" %EXTRA_PATCHES% %*
exit /b %ERRORLEVEL%
