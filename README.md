# Silent Explorers — NASA Hackathon

An interactive website about the machines left on the Moon and Mars.

## Run locally

Open `dist/index.html` in a browser. Keep the `dist` folder and its assets together.

Alternatively, from this folder run:

```sh
python -m http.server 8000 --directory dist
```

Then visit http://localhost:8000.

## Project files

- `dist/`: complete website, JavaScript, CSS, mission illustrations, and planetary assets.
- `tools/build_solar_maps.py`: optional planetary sprite generation tool; requires NumPy, Pillow, and source maps supplied using `--maps`.
- `backups/`: saved earlier designs and scripts for restoring previous versions.
- `MERGE_NOTES.md`: background on the combined project.

## Navigation

Scroll through the solar journey, signal page, and Story Orbit. Scroll pacing keeps the sections readable. Story Orbit also supports its arrow buttons and the left/right arrow keys. Its next button highlights after five seconds without navigation. Use the archive to filter Moon and Mars missions or jump to a story.

## Assets and credits

See `dist/assets/solar/ASSET_CREDITS.md` for planetary texture attribution and licensing. Mission sources are linked in the website. Preserve these credits when sharing the project.

This is a static site: no package installation or build is needed to view it. No deployment configuration or hosted site is created by importing this repository.
