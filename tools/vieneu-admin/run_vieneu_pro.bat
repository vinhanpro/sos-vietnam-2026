@echo off
setlocal

set "CONFIG_DIR=%LOCALAPPDATA%\com.vieneu.app"
set "TARGET_FILE=%CONFIG_DIR%\account.json"
set "ADMIN_BACKUP=%CONFIG_DIR%\account_admin.json"
set "APP_DIR=%LOCALAPPDATA%\VieNeu"
set "APP_EXE=%APP_DIR%\vieneu-app.exe"
set "SCRIPT_DIR=%~dp0"

:: 1. Restore Admin Config if backup exists
if exist "%ADMIN_BACKUP%" (
    attrib -r "%TARGET_FILE%" >nul 2>&1
    copy /y "%ADMIN_BACKUP%" "%TARGET_FILE%" >nul 2>&1
    attrib +r "%TARGET_FILE%" >nul 2>&1
)

:: 2. Launch Background Protector daemon
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%SCRIPT_DIR%protect_admin.ps1"

:: 3. Launch VieNeu Desktop App with its correct working directory
cd /d "%APP_DIR%"
start "" "%APP_EXE%"

exit
