---
name: herdr2-install
description: "Install or upgrade the Herdr2 desktop app, h2 core CLI/daemon, and Herdr2 companion skills (`herdr2`, `drove`, `drove-add`, `drove-setup`) on macOS, Linux, Windows, or WSL directly from GitHub Releases. Use when the user asks to install Herdr2, set up h2, download Herdr2 from GitHub, or fix a Herdr2 installation."
---

# Herdr2 One-Stop Agent Installer Skill

Follow these exact steps to install **Herdr2** (desktop app + `h2` core daemon + companion skills) cleanly on the user's machine from GitHub Releases (`https://github.com/herdr2/herdr2`).

## Step 1: Detect Platform & Architecture

Run a quick platform check first:
- **macOS**: `uname -s` is `Darwin`, `uname -m` is `arm64` (Apple Silicon).
- **Linux / WSL**: `uname -s` is `Linux`, `uname -m` is `x86_64` (check if `/proc/version` mentions `Microsoft` for WSL — in WSL, install Linux `h2` core inside WSL AND optionally install the Windows desktop app on the Windows host).
- **Windows (PowerShell)**: `$env:OS -eq "Windows_NT"`, x64 (`AMD64`).

## Step 2: Download & Install from GitHub Releases

Default repository: `herdr2/herdr2`
- Latest full release page: `https://github.com/herdr2/herdr2/releases/latest`
- Rolling OTA channel: `https://github.com/herdr2/herdr2/releases/download/ota-latest`

### Option A — macOS (Apple Silicon)

Download the latest `.dmg` (contains `Herdr2.app` with bundled `h2` core) or run the one-line installer:

```bash
# Recommended: direct one-line installer (installs ~/Applications/Herdr2.app + ~/.local/bin/herdr2 + h2)
curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
```

Or if installing from the `.dmg` asset on GitHub Releases:
```bash
TAG=$(curl -fsSL https://api.github.com/repos/herdr2/herdr2/releases/latest | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1)
VER=${TAG#v}
DMG="/tmp/Herdr2-${VER}-macos-aarch64.dmg"
curl -fsSL "https://github.com/herdr2/herdr2/releases/download/${TAG}/Herdr2-${VER}-macos-aarch64.dmg" -o "$DMG"
MOUNT=$(hdiutil attach "$DMG" -nobrowse | awk '/\/Volumes\//{print $NF; exit}')
mkdir -p "$HOME/Applications" "$HOME/.local/bin"
rm -rf "$HOME/Applications/Herdr2.app"
cp -R "$MOUNT/Herdr2.app" "$HOME/Applications/Herdr2.app"
hdiutil detach "$MOUNT" -quiet || true
ln -sfn "$HOME/Applications/Herdr2.app/Contents/MacOS/Herdr2" "$HOME/.local/bin/herdr2"
ln -sfn "$HOME/Applications/Herdr2.app/Contents/Helpers/h2" "$HOME/.local/bin/h2"
```

### Option B — Linux

1. **Debian / Ubuntu (`.deb` single package — installs `/usr/bin/herdr2` + `/usr/bin/h2` + desktop launcher)**:
   ```bash
   TAG=$(curl -fsSL https://api.github.com/repos/herdr2/herdr2/releases/latest | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1)
   VER=${TAG#v}
   DEB="/tmp/herdr2_${VER}_amd64.deb"
   curl -fsSL "https://github.com/herdr2/herdr2/releases/download/${TAG}/herdr2_${VER}_amd64.deb" -o "$DEB"
   sudo apt-get install -y "$DEB"
   ```
2. **Any Linux distro without sudo (universal bundle or one-liner)**:
   ```bash
   curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
   ```
3. **Headless Linux server / WSL (CLI & daemon only, no GUI needed)**:
   ```bash
   curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/core-install.sh | sh
   ```

### Option C — Windows (PowerShell)

Download and run the unified Windows Setup installer (`Herdr2-Setup-<ver>-windows-x86_64.exe`, installs App into `%LOCALAPPDATA%\Programs\herdr2` and `h2` Core into `%LOCALAPPDATA%\Programs\h2` with no admin rights required):

```powershell
$rel = Invoke-RestMethod "https://api.github.com/repos/herdr2/herdr2/releases/latest"
$asset = $rel.assets | Where-Object { $_.name -like "Herdr2-Setup-*-windows-x86_64.exe" } | Select-Object -First 1
$exe = Join-Path $env:TEMP $asset.name
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $exe
Start-Process -FilePath $exe -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
```

Or via PowerShell one-liner:
```powershell
irm https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.ps1 | iex
```

## Step 3: Verify Installation & Start Core Daemon

Make sure `~/.local/bin` (Unix) or `%LOCALAPPDATA%\Programs\h2` & `%LOCALAPPDATA%\Programs\herdr2` (Windows) are on `PATH`, then verify:

```bash
h2 --version
h2 server start
h2 server status
herdr2 --version
```

## Step 4: Install Herdr2 Companion Skills into Local Agents

Install the bundled companion skills (`herdr2`, `drove`, `drove-add`, `drove-setup`) into all detected coding agents (Antigravity, Claude Code, Codex, Cursor, OpenCode, Windsurf):

```bash
h2 skill install --all
h2 skill status
```

If the user uses a custom skills directory (e.g., `~/.my-agent/skills`), install there directly:
```bash
h2 skill install --target ~/.my-agent/skills
```

## Step 5: First Launch & Core AI Setup

1. Launch the Herdr2 desktop app (`herdr2` or open from Applications / Start Menu).
2. On first launch, the Welcome wizard requires configuring **Core AI** — **DeepSeek Official API** is recommended:
   - Service URL: `https://api.deepseek.com/v1`
   - Model: `deepseek-chat`
   - API Key portal: `https://platform.deepseek.com/api_keys`
3. After entering the API key and passing the connectivity test, Herdr2 is ready to use.
4. Future code pushes automatically generate hot-update packages — when an update is ready, an **Update / 更新** button appears in the top-right bar of Herdr2 for one-click hot deployment.
