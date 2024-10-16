# Define the watch and output directories, and preset path
$watchDir = "C:\Users\Max\Desktop\folder"
$outputDir = "C:\Users\Max\Desktop\output"
$preset = "C:\Users\Max\Desktop\profile.pp3"
$rawTherapeeCLI = "C:\Program Files\RawTherapee\5.11\rawtherapee-cli.exe"

# Hashtable to keep track of processed files
$processedFiles = @{}

Write-Host "Monitoring $watchDir for new .CR3 files. Press Ctrl+C to stop."

while ($true) {
    # Get all .CR3 files in the watch directory (case-insensitive)
    $files = Get-ChildItem -Path $watchDir -File | Where-Object { $_.Extension -ieq ".cr3" }

    foreach ($file in $files) {
        $filePath = $file.FullName

        # Check if the file has already been processed
        if ($processedFiles.ContainsKey($filePath)) {
            continue
        }

        try {
            Write-Host "Processing new file: $filePath"

            # Wait briefly to ensure the file is fully copied
            Start-Sleep -Seconds 1

            # Run RawTherapee CLI to process the image
            & "$rawTherapeeCLI" -Y -o "$outputDir" -p "$preset" -c "$filePath"

            Write-Host "Successfully processed $filePath"

            # Mark the file as processed
            $processedFiles[$filePath] = $true
        } catch {
            Write-Error "Error processing file: $_"
        }
    }

    # Wait before checking again
    Start-Sleep -Seconds 5
}
