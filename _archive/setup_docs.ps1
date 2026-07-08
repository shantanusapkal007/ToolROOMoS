$docsDir = "e:\projects\enterprise toolroom\ToolRoomOS\docs"

$newDirs = @(
    "01_Business_Analysis",
    "02_Vision",
    "03_Business_Processes",
    "04_Business_Rules",
    "05_Master_Data",
    "06_Documents",
    "07_Workflows",
    "08_Automation",
    "09_Finance",
    "10_UX",
    "11_Database",
    "12_API",
    "13_Architecture",
    "14_Security",
    "15_Reports",
    "16_Deployment",
    "17_Development",
    "18_Roadmap"
)

foreach ($dir in $newDirs) {
    New-Item -ItemType Directory -Force -Path "$docsDir\$dir" | Out-Null
}
Write-Host "New docs directory structure created."
