[CmdletBinding(PositionalBinding = $false)]
param(
    [string]$Model = 'qwen2.5-coder:14b-instruct',
    [string]$OllamaUrl = 'http://127.0.0.1:11434/v1',
    [string]$Profile = 'web',
    [string]$Overlay,
    [switch]$Life,
    [switch]$Commerce,
    [switch]$Finance,
    [switch]$DevOps,
    [switch]$Marketing,
    [switch]$AI,
    [switch]$Creative,
    [switch]$Integrations,
    [switch]$AllIntegrations,
    [switch]$NoOpen,
    [switch]$ForceBuild,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs
)

$ErrorActionPreference = 'Stop'

# Suppress npm noise from pnpm/corepack environment
Remove-Item env:npm_config_manage_package_manager_versions -ErrorAction SilentlyContinue

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = $root.TrimEnd('\\')
$dshHome = Join-Path $root '.dsh-ollama'
$env:DSH_HOME = $dshHome
$env:OLLAMA_API_KEY = if ($env:OLLAMA_API_KEY) { $env:OLLAMA_API_KEY } else { 'ollama' }

New-Item -ItemType Directory -Force -Path $dshHome | Out-Null

@"
llm-pi-ai:
  providers:
    openai:
      apiKeyEnv: OLLAMA_API_KEY
      api: openai-completions
      baseURL: $OllamaUrl
      compat:
        supportsDeveloperRole: false
        maxTokensField: max_tokens
        thinkingFormat: qwen
      models:
        - id: $Model
          input: [text]
          contextWindow: 32768
          maxTokens: 4096
agent-default-model:
  provider: openai
  model: $Model
"@ | Set-Content -Path (Join-Path $dshHome 'settings.yaml') -Encoding utf8

if ($env:NODE_HOME) {
    $env:PATH = "$env:NODE_HOME;$env:PATH"
}

# Pre-flight check: warn if Ollama is not reachable
try {
    $baseEndpoint = $OllamaUrl -replace '/v1/?$', ''
    $response = Invoke-WebRequest -Uri $baseEndpoint -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if (-not $response -or $response.StatusCode -ne 200) {
        Write-Warning "Ollama endpoint ($baseEndpoint) did not return HTTP 200. Ensure Ollama is running ('ollama serve')."
    }
} catch {
    Write-Warning "Could not connect to Ollama at $OllamaUrl. Ensure Ollama is running ('ollama serve')."
}

Push-Location $root
try {
    $pnpm = Get-Command pnpm -ErrorAction Stop
    $webDist = Join-Path $root 'apps\web\dist\index.html'
    if ($ForceBuild -or (-not (Test-Path -LiteralPath $webDist))) {
        Write-Host "Building deepseek-harness web frontend and libraries (pnpm run build)..."
        & $pnpm.Source run build
    }

    $dshArgs = @('dsh', '--profile', $Profile)
    $dshArgs += @('--patch', (Join-Path $root 'ollama-headless.patch.yml'))
    $dshArgs += @('--patch', (Join-Path $root 'hardware-monitor-windows.patch.yml'))

    if ($Life) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\01-life-management.patch.yml'))
        Write-Host "Mounting Domain I: Central Life Management overlay..." -ForegroundColor Cyan
    }
    if ($Commerce) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\02-ecommerce-arbitrage.patch.yml'))
        Write-Host "Mounting Domain II: E-Commerce & Arbitrage overlay..." -ForegroundColor Cyan
    }
    if ($Finance) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\03-financial-autonomy.patch.yml'))
        Write-Host "Mounting Domain III: Financial Autonomy overlay..." -ForegroundColor Cyan
    }
    if ($DevOps) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\04-enterprise-devops.patch.yml'))
        Write-Host "Mounting Domain IV: Enterprise & DevOps overlay..." -ForegroundColor Cyan
    }
    if ($Marketing) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\05-growth-marketing.patch.yml'))
        Write-Host "Mounting Domain V: Growth Marketing overlay..." -ForegroundColor Cyan
    }
    if ($AI) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\06-ai-multimodal-infra.patch.yml'))
        Write-Host "Mounting Domain VI: AI & Multimodal Infra overlay..." -ForegroundColor Cyan
    }
    if ($Creative) {
        $dshArgs += @('--patch', (Join-Path $root 'overlays\07-creative-endeavor.patch.yml'))
        Write-Host "Mounting Domain VII: Creative Endeavors overlay..." -ForegroundColor Cyan
    }

    if ($AllIntegrations -or $Integrations) {
        $masterOverlay = Join-Path $root 'overlays\all-integrations.patch.yml'
        if (Test-Path -LiteralPath $masterOverlay) {
            Write-Host "Mounting master integration overlay (140 integrations)..." -ForegroundColor Cyan
            $dshArgs += @('--patch', $masterOverlay)
        }
    } elseif ($Overlay) {
        $resolvedOverlay = if (Test-Path -LiteralPath $Overlay) { $Overlay } else { Join-Path $root $Overlay }
        if (Test-Path -LiteralPath $resolvedOverlay) {
            Write-Host "Mounting integration overlay: $resolvedOverlay" -ForegroundColor Cyan
            $dshArgs += @('--patch', $resolvedOverlay)
        } else {
            Write-Warning "Overlay file not found: $Overlay"
        }
    }

    if ($NoOpen) {
        $dshArgs += '--no-open'
    }

    if ($ExtraArgs) {
        $dshArgs += $ExtraArgs
    }

    Write-Host "Launching DeepSeek Harness (Profile: $Profile, Model: $Model)..." -ForegroundColor Green
    & $pnpm.Source @dshArgs
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
