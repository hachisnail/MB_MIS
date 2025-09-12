@echo off
echo Starting MB_MIS Development Environment...
echo.

REM Start client in new window
echo Starting Client (Vite Dev Server)...
start "MB_MIS Client" cmd /k "cd client && npm run dev"

REM Wait a moment before starting server
timeout /t 2 /nobreak >nul

REM Start server in new window
echo Starting Server (Node.js)...
start "MB_MIS Server" cmd /k "cd server && node index.js"

echo.
echo Both services are starting in separate windows:
echo - Client: http://localhost:5173 (typical Vite port)
echo - Server: Check server window for port information
echo.
echo To stop services, close the respective terminal windows.
pause
