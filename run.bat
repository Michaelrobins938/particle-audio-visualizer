@echo off
start "" cmd /k "npx serve ."
timeout /t 3 >nul
start "" chrome http://localhost:3000
