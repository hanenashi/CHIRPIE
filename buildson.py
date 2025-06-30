import os
import json

BASE_DIR = r'C:\GIT\CHIRPIE\birds'
OUTPUT_FILE = os.path.join(BASE_DIR, '..', 'birds.json')

def build_bird_index(base_path):
    bird_data = {}
    for bird_folder in os.listdir(base_path):
        folder_path = os.path.join(base_path, bird_folder)
        if os.path.isdir(folder_path):
            entry = {
                'mp3': [],
                'jpg': None,
                'txt': None
            }

            for filename in os.listdir(folder_path):
                filepath = f'birds/{bird_folder}/{filename}'
                lower = filename.lower()
                if lower.endswith('.mp3'):
                    entry['mp3'].append({
                        'name': os.path.splitext(filename)[0],
                        'file': filepath
                    })
                elif lower.endswith('.jpg') and not entry['jpg']:
                    entry['jpg'] = filepath
                elif lower.endswith('.txt') and not entry['txt']:
                    entry['txt'] = filepath

            bird_data[bird_folder] = entry
    return bird_data

if __name__ == '__main__':
    print(f"Scanning: {BASE_DIR}")
    birds = build_bird_index(BASE_DIR)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(birds, f, indent=2, ensure_ascii=False)
    print(f"Output written to: {OUTPUT_FILE}")
