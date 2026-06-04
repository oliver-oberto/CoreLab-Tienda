$NodeDir = "C:\Users\PC\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.16.0-win-x64"
$env:Path = "$NodeDir;" + $env:Path

Write-Host "Verifying node and npm versions..."
node -v
npm -v

Write-Host "Installing dependencies..."
npm install

Write-Host "Starting Next.js development server..."
npm run dev
