$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = $root.TrimEnd('\\')
$dshHome = Join-Path $root '.dsh-ollama'
$env:DSH_HOME = $dshHome
$env:OLLAMA_API_KEY = 'ollama'

New-Item -ItemType Directory -Force -Path $dshHome | Out-Null

@'
llm-pi-ai:
  providers:
    openai:
      apiKeyEnv: OLLAMA_API_KEY
      api: openai-completions
      baseURL: http://127.0.0.1:11434/v1
      compat:
        supportsDeveloperRole: false
        maxTokensField: max_tokens
      models:
        - id: qwen2.5-coder:14b-instruct
          input: [text]
          contextWindow: 32768
          maxTokens: 4096
agent-default-model:
  provider: openai
  model: qwen2.5-coder:14b-instruct
'@ | Set-Content -Path (Join-Path $dshHome 'settings.yaml') -Encoding utf8

if ($env:NODE_HOME) {
    $env:PATH = "$env:NODE_HOME;$env:PATH"
}

Push-Location $root
try {
    $pnpm = Get-Command pnpm -ErrorAction Stop
  & $pnpm.Source dsh --profile web --patch (Join-Path $root 'ollama-headless.patch.yml')
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
