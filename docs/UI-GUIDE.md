# Deskemon UI Guide

The design system for the information layer that sits around the face.

Live reference: run the app and open `#style`. Expressions: `#face-lab`.

---

## 1. The governing rule

**The face is never tinted.**

The face is pure white on pure black, always. Colour exists only in the
information layer. This is not a stylistic preference — it is what keeps the
character's identity stable. If coral could wash over the eyes, coral would stop
meaning "this needs your attention" and start meaning "the mood changed."

One consequence worth stating plainly: an accent colour on screen always refers
to *information*, never to *emotion*. Emotion is carried entirely by eye shape.

## 2. Style position

Classified as **AI-Native UI**: conversational, ambient, minimal chrome, voice-led.
That family's conventions we deliberately keep — typing indicators, pulse
feedback, context cards, smooth reveals. Its usual typography (Orbitron,
JetBrains Mono, the cyberpunk-tactical register) we reject: Deskemon is warm and
huggable, not a HUD.

Baymax's design lineage is soft robotics — inflatable vinyl, movement modelled on
baby penguins and a toddler's waddle. The UI agrees with the character: large
radii, generous space, nothing sharp, nothing dense.

## 3. Colour

| Token | Value | Role |
|---|---|---|
| `void` | `#000000` | The face's world. True black for OLED and maximum contrast |
| `surface` | `#14161d` | Panel background |
| `surfaceRaised` | `#1c1f28` | Secondary buttons |
| `line` | `#2a2e3a` | Hairlines only — never heavier |
| `text` | `#ffffff` | Primary |
| `textSoft` | `#a8b0c2` | Secondary |
| `textFaint` | `#818b9e` | Field labels |
| `coral` | `#ff6b5e` | Conflict / caution. Used **once**, on the hero moment |
| `teal` | `#4ecdc4` | Confirmation / success / trust / live mic |

### Verified contrast

Measured, not assumed (WCAG 2.1 relative luminance):

| Pair | Ratio | Grade |
|---|---|---|
| white on `void` | 21.00 | AAA |
| white on `surface` | 18.07 | AAA |
| `teal` on `void` | 10.85 | AAA |
| `teal` on `surface` | 9.34 | AAA |
| primary button text on `teal` | 8.82 | AAA |
| `textSoft` on `surface` | 8.31 | AAA |
| `coral` on `surface` | 6.47 | AA |
| `textFaint` on `surface` | 5.27 | AA |

`textFaint` was originally `#6b7488` at **3.85:1**, which fails AA for the 14px
labels it is used on. Raised to `#818b9e`. Re-verify with the checker in
`docs/` whenever a value changes.

**Colour is never the only signal.** The conflict card pairs coral with the
literal words "But you're booked"; success pairs teal with "Got it."

## 4. Type

System stack (`-apple-system`, `Segoe UI`, `system-ui`) — it renders instantly
with no font-loading shift, supports Dynamic Type, and stays neutral enough to
let the face carry the personality.

| Role | Spec | Use |
|---|---|---|
| Title | 25px / 600 / 1.25 | Panel headings |
| Label | 19px / 600 / 1.3 | State labels, fact values |
| Body | 17px / 400 / 1.45 | Sentences, captions |
| Meta | 14px / 500 / 1.35 | Field labels, pills |
| Button | 18px / 600 | Actions |

Body is 17px, above the 16px mobile minimum. Line-height 1.45–1.5 on running
text. Short sentences only — never a wall of text near the character.

## 5. Space, radius, motion

**Spacing** runs on a 4/8 rhythm: `xs 6 · sm 10 · md 16 · lg 24 · xl 36`.

**Radius** is deliberately large — Baymax has no corners: `sm 12 · md 18 ·
lg 26 · pill 999`. Every button is a pill.

**Motion** uses one shared set of curves so the whole interface moves with a
single rhythm:

| Token | Duration | Curve |
|---|---|---|
| `quick` | 180ms | `cubic-bezier(0.2, 0.8, 0.3, 1)` |
| `settle` | 340ms | same |
| `sheet` | 420ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

All within the 150–300ms micro-interaction guidance, with panel transitions at
420ms (under the 500ms ceiling). Animate `transform` and `opacity` only.

## 6. Layout — why landscape changed everything

Landscape-locked. A phone in landscape is roughly **844 × 390** — only 390px
tall. A conventional bottom sheet is impossible: the first build overflowed,
clipped its buttons, and collided the caption with the title.

**The resolved pattern is two columns.** The information panel takes the right
~62% (max 560px) at full height; the face keeps the left column, shrinking from
72% to 46% height and staying visible at 10–12% opacity. Captions follow the
face into its column.

This satisfies the brief better than an overlay would: information is
uncontested, and the character stays present and reacting rather than being
covered.

Panels use `justify-content: safe center` — centred when short, top-aligned when
content overflows, so a title is never clipped.

Safe areas are respected on all four edges via `env(safe-area-inset-*)` —
landscape puts the notch on a *side*, which is easy to forget.

## 7. Components

| Component | Notes |
|---|---|
| `Button` | 4 kinds: primary (teal), secondary, ghost, danger. Min height **52px**, above the 44pt floor |
| `StatusPill` | Tones: live (teal), neutral, muted. Optional status dot |
| `Sheet` | The right-hand panel. Optional 3px accent spine |
| `FactRow` | Meta label above a label-size value. Optional coral/teal tone |
| `Caption` | Spoken output, `aria-live="polite"`, on a 55% scrim for legibility over the face |
| `Toast` | Transient notices, top-centre |
| `PrivacyControl` | Persistent. 52px, `aria-pressed`, descriptive `aria-label` |

Buttons sit in `Actions` with a 10px gap — above the 8px minimum separation.

## 8. Accessibility commitments

- **Touch**: every target ≥52px, ≥10px apart.
- **Focus**: 3px teal ring at 2px offset. Never removed — the demo is rehearsed
  on a laptop by keyboard.
- **Labels**: the privacy control is icon-only, so it carries a full
  `aria-label` that states both current state and what tapping does.
- **Live regions**: captions are `aria-live="polite"` so spoken output reaches
  screen readers without stealing focus.
- **Reduced motion**: we do **not** remove all motion. Motion is how state is
  communicated here, so removing it would make the interface *less* usable.
  Instead we drop vestibular triggers — large translations and scaling — and keep
  opacity transitions. Breathing and blinking stop; expression changes still read.

## 9. Icons

SVG only, never emoji. Single family, consistent 2px stroke, round caps to match
the character's softness.

## 10. Anti-patterns

- Tinting the face
- More than one accent colour on screen at once
- A curved bar — it immediately reads as a mouth, and the character has none
- Sound arcs when audio is not genuinely being processed; the listening
  indicator is a trust signal, not decoration
- Walls of text near the face
- Fake technical logs during Thinking — copy cycles through truthful stages only
- Sharp corners, heavy borders, dense tables
