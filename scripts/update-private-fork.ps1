[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ReleaseTag,

    [Parameter(Mandatory = $true)]
    [string[]]$OverlayCommit,

    [string]$UpstreamRemote = 'upstream',
    [string]$OriginRemote = 'origin',
    [switch]$AllowPrerelease,
    [switch]$Push,
    [switch]$SkipValidation
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Invoke-CommandChecked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$currentBranch = (git symbolic-ref --short HEAD 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    throw 'update-private-fork: run from a named branch, not detached HEAD'
}

$trackedChanges = git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'update-private-fork: tracked working-tree changes exist' }
$stagedChanges = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'update-private-fork: staged changes exist' }

if (-not $AllowPrerelease -and $ReleaseTag -notmatch '^dsh-v\d+\.\d+\.\d+$') {
    throw "update-private-fork: '$ReleaseTag' is not a stable DSH tag; use dsh-vX.Y.Z or pass -AllowPrerelease"
}

Write-Host "Fetching $UpstreamRemote tags..."
Invoke-Git @('fetch', $UpstreamRemote, '--tags', '--prune')

$tagRef = "refs/tags/$ReleaseTag"
& git show-ref --verify --quiet $tagRef
if ($LASTEXITCODE -ne 0) {
    throw "update-private-fork: upstream tag '$ReleaseTag' was not found"
}

foreach ($commit in $OverlayCommit) {
    & git cat-file -e "$commit^{commit}"
    if ($LASTEXITCODE -ne 0) {
        throw "update-private-fork: overlay commit '$commit' was not found"
    }
}

$branchName = "update/upstream-$ReleaseTag"
& git show-ref --verify --quiet "refs/heads/$branchName"
if ($LASTEXITCODE -eq 0) {
    throw "update-private-fork: branch '$branchName' already exists"
}

Write-Host "Creating $branchName from $ReleaseTag..."
Invoke-Git @('switch', '-c', $branchName, $ReleaseTag)

try {
    foreach ($commit in $OverlayCommit) {
        Write-Host "Reapplying private overlay $commit..."
        Invoke-Git @('cherry-pick', $commit)
    }

    if (-not $SkipValidation) {
        Write-Host 'Installing locked dependencies...'
        Invoke-CommandChecked 'pnpm' @('install', '--frozen-lockfile')
        Write-Host 'Running typecheck...'
        Invoke-CommandChecked 'pnpm' @('run', 'typecheck')
        Write-Host 'Running full build...'
        Invoke-CommandChecked 'pnpm' @('run', 'build')
    }

    if ($Push) {
        Write-Host "Pushing $branchName to $OriginRemote..."
        Invoke-Git @('push', '-u', $OriginRemote, $branchName)
    }

    Write-Host "Update ready: $branchName"
    Write-Host "Review with: git diff $ReleaseTag...$branchName"
    Write-Host "Promote with: git switch master; git merge --ff-only $branchName"
}
catch {
    Write-Error $_
    Write-Host "The integration branch remains checked out: $branchName"
    Write-Host 'Resolve the error, or abort an interrupted cherry-pick with: git cherry-pick --abort'
    exit 1
}
