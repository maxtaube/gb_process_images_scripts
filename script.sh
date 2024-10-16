#!/bin/bash

# Windows paths accessed from WSL use /mnt/driveletter/path format
# adjust, when running it within linux
WATCH_DIR="/mnt/c/Users/Max/Desktop/folder"
OUTPUT_DIR="C:\Users\Max\Desktop\output"
PRESET="C:\Users\Max\Desktop\profile.pp3"

process_image() {
    local file="$1"
    local base_name="$(basename "$file" .cr3)"
    
    # Process the file using RawTherapee
    "/mnt/c/Program\ Files/RawTherapee/5.11/rawtherapee-cli.exe" -o "$OUTPUT_DIR" -p "$PRESET" -c "$file"
    
    echo "Processed $file and saved as JPG in $OUTPUT_DIR"
    
    # Optionally, delete the original file after processing
    rm "$file"
}

# Use inotifywait to monitor the directory for new files
inotifywait -m "$WATCH_DIR" -e create -e moved_to |
    while read dir action file; do
        # Only process CR3 files
        if [[ "$file" == *.cr3 ]]; then
            process_image "$WATCH_DIR/$file"
        fi
    done