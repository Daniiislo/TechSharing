<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## communication
- primary_language: en
- audience: Geronimo devs who attended ProtoLab; varying familiarity with .NET and TravelPledgeAuctions
- objective: Explain SignalR as a framework and what it does for us, set the preparation mindset, trace how Geronimo syncs a bid (Phase 1 connect, Phase 2 bid and update) with code-flow diagrams, and close with best practices and the bidderId and max-bid holes, so devs can tell which part is Geronimo code and which is SignalR and remember what to fix
- core_message: SignalR is a real-time library, not a transport: it negotiates the transport, keeps the connection alive, turns calls into messages and fans them out — you write the business logic, and you still own identity and what you broadcast.
- consumption_mode: presentation

## mode
- mode: custom
- mode_references: narrative
- mode_behavior: Open on one moment (Anna clicks PLACE BID, Ben's price changes) and let "who did that?" pull the audience through what SignalR is, what to prepare, and the trail of functions; the two holes are the climax, the lessons the resolution; titles read as story beats, not labels.

## visual_style
- visual_style: custom
- visual_style_references: editorial
- visual_style_behavior: Editorial layout — small cyan kicker, large serif headline, hairline rules and asymmetric columns; diagrams sit like magazine figures with margin notes. Violet marks SignalR evidence (dashed band, dashed nodes), cyan marks Geronimo code (solid outline), everything else monochrome navy on near-white.

## colors
- background: #F7F9FC
- secondary_bg: #E8F4F8
- primary: #102A43
- accent: #007F9E
- secondary_accent: #5B21B6
- body_text: #243B53
- secondary_text: #526B80
- divider: #CAD7E2
- signalr_tint: #F1EBFD
- warning: #B36A13

## typography
- font_family: Segoe UI, sans-serif
- title_family: Cambria, serif
- body_family: Segoe UI, sans-serif
- code_family: Consolas, monospace
- display_family: Cambria, serif
- body: 28
- title: 50
- subtitle: 38
- annotation: 22
- kicker: 20
- code: 22
- footnote: 16
- display: 88

## icons
- library: tabler-outline
- stroke_width: 2
- inventory: browser, server, plug-connected, refresh, shield-lock, users, user, database, alert-triangle, terminal-2, eye, clock, route, stack-2, hand-click

## page_rhythm
- P01: anchor
- P02: breathing
- P03: dense
- P04: dense
- P05: dense
- P06: dense
- P07: dense
- P08: dense
- P09: dense
- P10: dense
- P11: dense
- P12: breathing
- P13: dense
- P14: dense
- P15: anchor
- P16: dense

## page_visualizations
- P06: table/comparison_matrix

## pptx_structure
- mode: flat

## forbidden
- `mask`, `<style>`, `class`, external CSS, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<set>`, `<script>` / event attributes, `<iframe>`
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters
- trong slide, dùng tên 2 người tiếng anh luôn đi, và đừng mention gì đến protolab (user)
