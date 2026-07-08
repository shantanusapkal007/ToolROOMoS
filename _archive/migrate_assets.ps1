$sourceDir = "e:\projects\enterprise toolroom\tmp_toolroom"
$targetDir = "e:\projects\enterprise toolroom\ToolRoomOS"

# 1. Database Migrations
if (Test-Path "$sourceDir\backend\migrations") {
    Copy-Item -Path "$sourceDir\backend\migrations\*" -Destination "$targetDir\database\migrations" -Recurse -Force
}

# 2. Database Seed
if (Test-Path "$sourceDir\backend\global_seeder.sql") {
    Copy-Item -Path "$sourceDir\backend\global_seeder.sql" -Destination "$targetDir\database\seed" -Force
}
if (Test-Path "$sourceDir\backend\scripts\db") {
    Copy-Item -Path "$sourceDir\backend\scripts\db\*" -Destination "$targetDir\database\seed" -Recurse -Force
}

# 3. Database SQL files (assuming they are in backend/sql, which didn't exist but just in case)
if (Test-Path "$sourceDir\backend\sql") {
    # If it exists, copy to a temp location or just root of schema for manual sorting
    Copy-Item -Path "$sourceDir\backend\sql\*" -Destination "$targetDir\database\schema" -Recurse -Force
}

# 4. Frontend Constants and Types
if (Test-Path "$sourceDir\frontend\src\constants") {
    Copy-Item -Path "$sourceDir\frontend\src\constants\*" -Destination "$targetDir\frontend\src\constants" -Recurse -Force
}
if (Test-Path "$sourceDir\frontend\src\types") {
    Copy-Item -Path "$sourceDir\frontend\src\types\*" -Destination "$targetDir\frontend\src\types" -Recurse -Force
}

# 5. Frontend Public and Assets
if (Test-Path "$sourceDir\frontend\public") {
    Copy-Item -Path "$sourceDir\frontend\public\*" -Destination "$targetDir\frontend\public" -Recurse -Force
}
if (Test-Path "$sourceDir\frontend\src\assets") {
    Copy-Item -Path "$sourceDir\frontend\src\assets\*" -Destination "$targetDir\frontend\src\assets" -Recurse -Force
}

# 6. Docs
if (Test-Path "$sourceDir\docs") {
    Copy-Item -Path "$sourceDir\docs\*" -Destination "$targetDir\docs" -Recurse -Force
}

Write-Host "Assets migrated successfully."
