$filePath = 'frontend/package-lock.json'
$content = Get-Content $filePath -Raw

# Replace all conflict blocks, keeping only the incoming changes (after =======)
$resolved = $content -replace '<<<<<<< HEAD[\r\n]+(?:[^\r\n][\r\n]*)*?=======[\r\n]+((?:[^\r\n][\r\n]*)*?)>>>>>> [^\r\n]+[\r\n]*', '$1'

# Write the resolved content back
Set-Content $filePath -Value $resolved -NoNewline

Write-Host "Conflicts resolved in $filePath"
