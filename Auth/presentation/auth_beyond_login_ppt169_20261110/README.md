# Auth — Beyond the Login Screen

Deck: `../Auth - Beyond the Login Screen.pptx`.

English slides with a separate Vietnamese guide at `../../docs/auth-presentation-presenter-guide.md`. Nineteen main slides target 43 minutes including a five-minute demo slot and Q&A. Six appendix slides follow the main closing. No speaker notes or narration audio.

Slides 12–13 and appendix A5 are supported by the Vietnamese [Authorization study guide](../../docs/05-authorization.md).

The Auth demo is a proposed BidLab scenario, not an implemented feature. Slide 18 makes that status explicit. Rehearse timing before presenting; the 43-minute budget is an estimate.

Authored through ppt-master's SVG-to-native-DrawingML workflow. The original 26-slide export was opened in Microsoft PowerPoint and visually inspected. Edit slide-local text and diagram shapes directly in PowerPoint, or revise the authoritative `svg_output/` pages and re-export. `design_spec.md` and `spec_lock.md` retain the content/design contract.

Use `layout.json` as the shared slide layout. It records the fixed header, content area, first-tile anchor and footer coordinates on the 1280 × 720 canvas. Keep these coordinates when editing or adding slides. On topic slides, show the exact numbered section from the Agenda in the small cyan label above the slide title. Use the same title and optional context positions across the deck.

When a slide's topic changes, keep its numeric prefix and rename the SVG to match the new topic in both `svg_output/` and `svg_final/`.

- Canvas format: ppt169
- Created: 20261110

## Directories

- `svg_output/`: raw SVG output
- `svg_final/`: self-contained SVG visual preview; may be inserted manually as an SVG image, but PowerPoint Convert to Shape is unsupported
- `images/`: runtime image pool; converter assets keep their original short filenames when possible
- `icons/`: project icon set — selected library icons copied in (via icon_sync.py) plus any custom icons you add; embedded from here at export
- `notes/`: speaker notes
- `templates/`: project templates
- `live_preview/`: browser preview runtime files and history (lock.json, server.log, edits.jsonl, annotations.jsonl)
- `sources/`: source materials and normalized markdown
- `analysis/`: machine-extracted intermediate analysis (PPTX intake, image_analysis.csv) — the pipeline's canonical must-read source/asset facts
- `validation/`: cold workflow audit log, SVG quality reports, and PPTX postflight audit reports
- `exports/`: final native DrawingML pptx deliverables only (timestamped); `_native_charts_tables.pptx` name with `--native-charts-and-tables`, `_narrated.pptx` name when narration audio is embedded
- `backup/<timestamp>/`: svg_output/ archive (always written in default-flow mode; safe to delete old timestamps)
