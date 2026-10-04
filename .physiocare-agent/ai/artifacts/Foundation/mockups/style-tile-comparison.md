# PhysioCare — S2 Style Direction (Revised)

## Status

- Stage: S2 — Style direction
- State: A — Kinetic Atlas selected; S3 token draft in progress
- Previous user selection: A — Calm Clinical
- Revised A refines that direction as **Kinetic Atlas**; it keeps the light, calm clinical tone and adds a distinctive movement-path visual.
- Copy: English + Traditional Chinese
- Scope: Style tiles, not final page layouts or approved production tokens
- Detailed rationale and wireframes: [style-tile-design-plan.md](./style-tile-design-plan.md)

## Production references reviewed

- [shadcn/ui dashboard example](https://ui.shadcn.com/examples/dashboard): restrained hierarchy and clear data presentation.
- [shadcn-admin](https://github.com/satnaing/shadcn-admin): responsive application navigation and accessible dashboard patterns.
- [TailAdmin](https://tailadmin.com/): responsive Tailwind dashboard composition and chart patterns.

## Revised variants

| Variant | Direction | What makes it fit PhysioCare | Trade-off | Preview |
|---|---|---|---|---|
| A | Kinetic Atlas — chalk, evergreen, movement green | Makes measured movement the signature visual; calm enough for both patient and therapist screens | Live camera view needs a focused contrast treatment | [Open tile A](./style-tile-variant-a-kinetic-atlas.html) |
| B | Field Lab — mist, navy, calibrated blue | Treats joint movement like a readable measurement instrument with aligned axes and history | More analytical; may feel less warm to patients | [Open tile B](./style-tile-variant-b-field-lab.html) |
| C | Grounded Studio — deep petrol, leaf, muted brass | Carries the existing camera demo into a dedicated, focused live-session workspace | A dark visual system may be tiring if applied to every portal screen | [Open tile C](./style-tile-variant-c-grounded-studio.html) |

## Recommendation

Continue with **A — Kinetic Atlas** for the shared patient/therapist product direction, while borrowing C's darker treatment only for the live camera workspace if S5 layout mockups support it. This carries forward the previously selected light clinical direction while replacing generic card-dashboard styling with a movement-path identity.

## Design review against the new frontend-design skill

- The earlier repeated-card / gradient-wash treatment was removed; B's grid is a measured plotting surface, not a decorative wash.
- Each concept is grounded in a home-exercise measurement or therapist-review moment.
- One visual anchor leads each tile: pose path, measured grid, or live pose canvas.
- Copy is plain, user-facing, and bilingual; safety language describes measurement rather than diagnosis.
- Type uses one humanist system stack with Traditional Chinese fallbacks; layout is left-aligned and responsive.
- Color, shape, and surface choices differ by concept; no ornamental labels or arbitrary motion are used.

## Approval

- Confirmed direction: A — Kinetic Atlas
- Approval: User reconfirmed on 2026-10-05
- Notes: S3 token draft is ready for review; no Phase 1 page layouts or route scaffolding have started.
