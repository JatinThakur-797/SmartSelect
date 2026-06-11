@echo off

if exist .env (
    echo Loading environment variables from .env...
    for /f "usebackq eol=# tokens=1* delims==" %%i in (".env") do (
        set %%i=%%j
    )
) else (
    echo WARNING: .env file not found! Using system defaults.
)

echo Starting Backend...
start cmd /k "cd SmartSelectBackend && .\mvnw spring-boot:run"

timeout /t 5

echo Starting Frontend...
start cmd /k "cd SmartSelectFrontend && npm run dev"

echo Both services started.