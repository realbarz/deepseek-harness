@echo off
setlocal

set ROOT=%~dp0
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%

set DSH_HOME=%ROOT%\.dsh-ollama
set OLLAMA_API_KEY=ollama

mkdir "%DSH_HOME%" 2>nul
(
  echo llm-pi-ai:
  echo   providers:
  echo     openai:
  echo       apiKeyEnv: OLLAMA_API_KEY
  echo       api: openai-completions
  echo       baseURL: http://127.0.0.1:11434/v1
  echo       compat:
  echo         supportsDeveloperRole: false
  echo         maxTokensField: max_tokens
  echo       models:
  echo         - id: qwen2.5-coder:14b-instruct
  echo           input: [text]
  echo           contextWindow: 32768
  echo           maxTokens: 4096
  echo agent-default-model:
  echo   provider: openai
  echo   model: qwen2.5-coder:14b-instruct
) > "%DSH_HOME%\settings.yaml"

if not "%NODE_HOME%"=="" (
  set PATH=%NODE_HOME%;%PATH%
)

cd /d "%ROOT%"
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not found on PATH.
  echo Set NODE_HOME to a portable Node installation or install pnpm globally.
  exit /b 1
)

pnpm dsh --profile web --patch "%ROOT%\ollama-headless.patch.yml"
exit /b %ERRORLEVEL%
