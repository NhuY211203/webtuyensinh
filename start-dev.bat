@echo off
echo Starting development servers...
echo.

echo Starting Laravel backend...
start "Laravel Backend" cmd /k "cd backend && php artisan serve"

echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo Starting React frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause