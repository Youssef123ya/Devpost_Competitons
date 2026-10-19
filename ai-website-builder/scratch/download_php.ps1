# Script to download and configure PHP 8.2.31 for the Laravel project
$phpUrl = "https://windows.php.net/downloads/releases/php-8.2.31-Win32-vs16-x64.zip"
$destDir = Join-Path $PSScriptRoot "..\php-bin"
$zipFile = Join-Path $PSScriptRoot "php-8.2.31.zip"

Write-Host "Creating target directory: $destDir"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

Write-Host "Downloading PHP from $phpUrl ..."
Invoke-WebRequest -Uri $phpUrl -OutFile $zipFile

Write-Host "Extracting ZIP archive to $destDir ..."
Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

Write-Host "Cleaning up ZIP file..."
Remove-Item -Path $zipFile -Force

Write-Host "Configuring php.ini..."
$iniDev = Join-Path $destDir "php.ini-development"
$iniFile = Join-Path $destDir "php.ini"

if (Test-Path $iniDev) {
    Copy-Item -Path $iniDev -Destination $iniFile -Force
    
    # Read the file content
    $content = Get-Content -Path $iniFile -Raw
    
    # Set extension_dir
    $content = $content -replace ';extension_dir = "ext"', 'extension_dir = "ext"'
    
    # Enable necessary extensions
    $extensions = @("curl", "fileinfo", "gd", "mbstring", "openssl", "pdo_mysql", "pdo_sqlite", "sqlite3", "zip")
    foreach ($ext in $extensions) {
        $content = $content -replace ";extension=$ext", "extension=$ext"
    }
    
    # Write updated content back to php.ini
    Set-Content -Path $iniFile -Value $content -Force
    Write-Host "php.ini configured successfully with standard Laravel extensions."
} else {
    Write-Warning "php.ini-development not found. Cannot configure php.ini."
}

Write-Host "PHP Setup Complete! Test execution:"
$phpExe = Join-Path $destDir "php.exe"
& $phpExe -v
