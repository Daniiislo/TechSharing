<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## communication
- primary_language: en
- audience: Geronimo developers with varied .NET experience
- objective: Explain core auth mechanisms and trace a bid through session, resource authorization and revocation in a 43-minute live talk
- core_message: Identity proof, session continuity, resource permission and revocation are distinct responsibilities on one request path
- consumption_mode: presentation

## mode
- mode: custom
- mode_behavior: Follow Anna from login to one bid, explain each mechanism when its question arises, and return to the opening questions before optional reference pages

## visual_style
- visual_style: custom
- visual_style_behavior: Inherit editorial serif headlines and navy/cyan colors, use open layouts and one focal visual per page after the TOTP slide, with concise labels and technical detail in the presenter guide

## colors
- background: #F7F9FC
- secondary_bg: #E8F4F8
- primary: #102A43
- accent: #007F9E
- secondary_accent: #5B21B6
- body_text: #243B53
- secondary_text: #526B80
- divider: #CAD7E2
- warning: #9C5A0A

## typography
- font_family: Segoe UI, sans-serif
- title_family: Cambria, serif
- body_family: Segoe UI, sans-serif
- code_family: Consolas, monospace
- display_family: Cambria, serif
- body: 28
- title: 46
- subtitle: 36
- lead: 32
- annotation: 22
- code: 24
- kicker: 18
- footnote: 16
- display: 76

## icons
- library: none
- inventory: none

## page_rhythm
- P01: anchor
- P02: dense
- P03: breathing
- P04: breathing
- P05: dense
- P06: breathing
- P07: breathing
- P08: breathing
- P10: breathing
- P11: breathing
- P12: breathing
- P13: breathing
- P14: breathing
- P15: breathing
- P16: breathing
- P17: anchor

- P09: breathing

## pptx_structure
- mode: flat

## forbidden
- `mask`, `<style>`, `class`, external CSS, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<set>`, `<script>` / event attributes, `<iframe>`
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters
