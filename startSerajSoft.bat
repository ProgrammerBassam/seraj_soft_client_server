@echo off
setlocal

:: Check if Nginx is already running
tasklist /FI "IMAGENAME eq nginx.exe" 2>nul | find /I "nginx.exe" >nul
if "%ERRORLEVEL%"=="0" (
    echo Nginx is already running.
) else (
    echo Starting Nginx...
    start "" "C:\Users\baxco\Downloads\nginx-1.26.1\nginx-1.26.1\nginx.exe"
    pause
)

:: Start the other executable
echo Starting server.exe...
start "" "C:\Users\baxco\projects\seraj_soft_client_server\server.exe"

endlocal