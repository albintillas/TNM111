# TNM111 Assignment 4 — Star Wars Network Comparison

## Run

No build step is needed.

- Option A: Open this folder in VS Code and use Live Server.
- Option B: Run a local static server from the project root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## What is implemented

- Two fixed force-directed node-link diagrams (left and right).
- Per-diagram episode range controls (`From` + `To`) for each diagram card.
- Each diagram visualizes the merged network of the selected inclusive range (e.g., 1-3 or 4-6).
- Brushing and linking: clicking a node highlights the same character across both diagrams if present.
- Details-on-demand tooltips:
  - Node: character name + value
  - Edge: source character + target character + edge weight
- Episode filtering (Option 2): dynamically choose episodes 1–7 for each diagram.
- Search with suggestions dropdown while typing character names.
- Additional global filters:
  - Minimum edge weight
  - Minimum node value
  - Toggle to show/hide isolated nodes
  - Reset Filters button to restore all filter controls to default
- Background music (`starwarssong.mp3`) starts on page load with a top-right mute/unmute toggle.
- Star Wars-inspired dark space theme.

## Notes

- Character matching across episodes is done by character name, not node index, because node indices vary between episode files.
- Data files are loaded from the `Data/` directory.
