# Auth Lab — UI audit, 17 November 2026

Scope: `wwwroot/index.html`, `app.css`, `refinements.css`, `app.js`, route `/`. Front-End Checklist corpus supplied by the user, plus Impeccable polish guidance. Existing green palette, Vietnamese copy and four-part scenario preserved. This is a scoped review, not a complete WCAG conformance certification.

## Findings addressed

| Priority | Rule | Evidence before fix | Owning source after fix | Verification |
|---|---|---|---|---|
| High | `accessibility/color-contrast` | Missing-permission orange text measured 3.80:1 against the content surface; muted text on presenter background measured 4.32:1. Both below the 4.5:1 normal-text floor. | `wwwroot/refinements.css:3` | WCAG luminance calculations: new status 6.43:1, muted text on presenter background 5.42:1. Input border contrast 3.56:1. |
| High | `accessibility/focus-management` | Clicking Xem phiên disabled the focused control; browser focus ended on the document after the request. | `wwwroot/app.js:104` | After request completes, active element remains `view-action` / the clicked action. Restore only when focus fell to body, avoiding stealing focus from another control. Main carries `aria-busy` during work. |
| High | `accessibility/skip-navigation` | No skip link before repeated header/navigation. | `wwwroot/index.html:5` | First link targets focusable `main-content`; link is revealed on keyboard focus. |
| Medium | `css/font-size` | Form labels 11px, role descriptions/statuses 10px, some metadata 8–9px. | `wwwroot/refinements.css:1` | Relative rem sizes; root respects user default. Measured main labels/status/role descriptions >=12px, inputs 16px. |
| Medium | `accessibility/touch-targets` | Most action buttons were 34–39px tall. These met the AA 24px floor but missed the 44px platform/AAA target. | `wwwroot/refinements.css:9` | All rendered buttons >=44px; checkbox clickable labels are larger than their visual boxes. |
| Medium | `css/horizontal-scroll`, `accessibility/zoom-reflow` | Narrow layout was only checked at 390px previously; dense action labels and token rows needed 320px coverage after increasing type. | `wwwroot/refinements.css:130` | Single column on mobile, stacked fields at <=380px, wrapping action/credential rows. At 320px viewport: clientWidth=scrollWidth=305px (15px scrollbar), no page overflow. |

## Additional refinements

- Reduced decorative header height, removed duplicate eyebrows, increased permission and role legibility, normalized control sizes.
- Kept explicit API attempts even when permission is missing: this is an intentional teaching feature, not a broken disabled state.
- Countdown now updates only credential status rather than rebuilding permission/role content every second (`app.js:52`, `app.js:167`).
- Added explicit non-submit button types. Existing form labels, lang, viewport scaling, password autocomplete, text-node rendering and reduced-motion styling remain in place.

## Automated detector interpretation

Impeccable detector was run once as instructed. It flagged inherited thick borders, repeated “Xem phiên”, warm background, toast shadow and the painting caption. Thick alert/section accents were removed. Repeated action wording is intentional: the same permission must be described consistently in role options and its action. Existing warm palette is retained as established design, not replaced during an audit. Toast has a vertical shadow offset (0 8px), not a zero-offset glow. Caption sits on the foreground dark hill (#3e6659), giving 5.61:1 against #eef1db; detector attributed the pale canvas behind overlapping hills and produced an advisory. Artwork is decorative illustration, not app information.

## Verification and limits

- JavaScript syntax and git whitespace checks pass.
- Browser verified login, role removal, 403 response, permission badges, and focus retention after async requests.
- Checked desktop layout and narrow mobile reflow; tablet composition inspected separately.
- No screen-reader session, cross-browser matrix, Lighthouse score or full automated accessibility engine run is claimed. In-memory localhost security model is unchanged; HTTPS findings for public services are outside this local teaching app's scope.
- Installed Impeccable (`pbakaus/impeccable`) and Taste (`Leonxlnx/taste-skill`) using Skill Installer. Taste was not applied to this operable app: its current company-site art-direction workflow would expand scope unnecessarily.
