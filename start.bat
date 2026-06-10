@echo off

echo Starting Backend...
start cmd /k "cd SmartSelectBackend && mvnw spring-boot:run"

timeout /t 5

echo Starting Frontend...
start cmd /k "cd SmartSelectFrontend && npm run dev"

echo Both services started.