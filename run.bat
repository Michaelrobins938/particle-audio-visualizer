cd /d E:\THREE_projects\Particula
start "" serve .
timeout /t 3 >nul
start start chrome http://localhost:3000
exit