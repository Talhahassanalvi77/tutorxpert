@echo off
echo ========================================
echo TutorXpert Database Setup
echo ========================================
echo.

:: Create PostgreSQL database
echo [1/4] Creating PostgreSQL database...
psql -U postgres -c "CREATE DATABASE tutorxpert;" 2>nul
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL database created
) else (
    echo ! PostgreSQL database may already exist or error occurred
)
echo.

:: Create MongoDB database
echo [2/4] Creating MongoDB database...
mongosh --eval "use tutorxpert" --quiet 2>nul
if %errorlevel% equ 0 (
    echo ✓ MongoDB database created
) else (
    echo ! MongoDB command may need adjustment
)
echo.

:: Test Redis connection
echo [3/4] Testing Redis connection...
redis-cli ping 2>nul
if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    echo ! Redis may not be running
)
echo.

:: Run database migrations
echo [4/4] Running database migrations...
cd /d "%~dp0"
node src\db\migrate.js
if %errorlevel% equ 0 (
    echo ✓ Migrations completed
) else (
    echo ! Migration error - check database connections
)
echo.

:: Seed database
echo Seeding database with sample data...
node src\db\seed.js
if %errorlevel% equ 0 (
    echo ✓ Database seeded successfully
) else (
    echo ! Seeding error
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Demo Credentials:
echo   Learner: student@example.com / learner123
echo   Tutor: sarah.johnson@tutorxpert.com / tutor123
echo   Admin: admin@tutorxpert.com / admin123
echo.
pause
