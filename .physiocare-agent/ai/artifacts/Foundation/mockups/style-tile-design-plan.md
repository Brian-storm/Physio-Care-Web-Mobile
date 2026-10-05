# PhysioCare — S2 Visual Design Plan

## Brief

- **Product:** Privacy-first home physiotherapy with on-device pose measurement.
- **Audience:** A patient doing a prescribed home exercise and the physiotherapist checking progress between visits.
- **Primary job:** Make movement evidence understandable to the patient and useful to the therapist, without implying diagnosis or replacing clinical judgment.
- **Distinctive visual anchor:** A measured movement trace / pose path—not a generic analytics dashboard.
- **Copy:** English + Traditional Chinese.
- **Technical constraints:** Static HTML previews; no new UI or font dependencies. Proposed CSS values are exploration only, not approved production tokens.

## Concepts

### A — Kinetic Atlas

- **Palette:** Chalk `#F7F9F6`, deep evergreen `#183E35`, motion green `#3A8B66`, pale measurement field `#E5F0E9`, safety ochre `#A96B25`, quiet line `#CAD8D0`.
- **Type:** One humanist system sans stack (`Aptos`, `PingFang TC`, `Microsoft JhengHei`, sans-serif); large sentence-case headings; tabular numerals for measurements.
- **Layout:** Left-aligned patient goal and next action; one large pose/trajectory visualization anchors the page; a narrow measurement rail and a chronological session strip carry supporting facts.
- **Principles:** Evidence first, quiet surfaces, color only for movement state and safety, measurement terms in plain language.

```text
┌─────────────────────────────────────────────────────────────────┐
│ PhysioCare                                  Patient / Therapist │
├───────────────────────────────────────┬─────────────────────────┤
│ Maya Chen · 今日目標                   │ 動作品質       84 / 100 │
│ 「動作更穩，逐步增加深度」             │ 次數             8 / 10 │
│                                       │ 安全提示       需留意   │
│       pose path / range trace         ├─────────────────────────┤
│                                       │ 開始椅子深蹲             │
├───────────────────────────────────────┴─────────────────────────┤
│ 過往訓練 ────●────────●────────●────────●── 進度趨勢             │
└─────────────────────────────────────────────────────────────────┘
```

### B — Field Lab

- **Palette:** Mist `#F1F5F7`, ink navy `#1D3446`, calibrated blue `#3A7197`, pale aqua `#DCEBED`, safety amber `#B56D2C`, grid line `#CCD9DF`.
- **Type:** The same legible humanist system sans stack; compact but readable data labels; strong numeral hierarchy.
- **Layout:** An open instrument-board composition: movement trace on a light plotting field, metrics aligned to a shared baseline, session history as a simple ruled timeline.
- **Principles:** Precise and analytical without a black-box/AI aesthetic; grid lines encode measurement, not decoration; no chart chrome beyond what helps comparison.

```text
┌─────────────────────────────────────────────────────────────────┐
│ PhysioCare     Patient view                                     │
├─────────────────────────────┬───────────────────────────────────┤
│ 今日訓練                     │ 08 / 10 次   動作品質 84          │
│ 椅子深蹲                     │ 膝部控制     待觀察              │
│ ┌─────────────────────────┐ │                                   │
│ │ range axis + pose trace │ │ 最近訓練                        │
│ │ measured movement path  │ │ 週一 ─ 週三 ─ 週五 ─ 今日       │
│ └─────────────────────────┘ │                                   │
│ 開始訓練                     │                                   │
└─────────────────────────────┴───────────────────────────────────┘
```

### C — Grounded Studio

- **Palette:** Deep petrol `#183432`, soft mineral `#263F3D`, warm white `#F3F5EE`, leaf `#93C1A5`, muted brass `#D4A85F`, quiet edge `#49605B`.
- **Type:** The same humanist system sans stack with generous body leading; warm white text, not all-white glare.
- **Layout:** Camera-led live-session workspace: the pose canvas is the single hero; a calm side rail holds reps, one key measure, and a clear stop/pause action.
- **Principles:** Preserve continuity with the existing squat demo while reducing its dashboard feel; dark mode is reserved for focused movement, never forced onto every portal page.

```text
┌─────────────────────────────────────────────────────────────────┐
│ PhysioCare     椅子深蹲                         隱私：影片留在裝置 │
├───────────────────────────────────────────────┬─────────────────┤
│                                               │ 08 / 10 次      │
│              live pose canvas                │ 動作品質 84     │
│              movement in focus               │ 膝部控制提示    │
│                                               │                 │
├───────────────────────────────────────────────┴─────────────────┤
│ 暫停訓練                                        結束並看結果       │
└─────────────────────────────────────────────────────────────────┘
```

## Review before building

The previous tiles reused a dashboard-card pattern, repeated decorative labels, rounded every surface, and used a gradient as atmosphere. Those are generic rather than specific to home rehabilitation. The revised concepts remove that chrome and make a movement trace, measured data, or the live pose view the single memorable element. No cream-and-terracotta editorial treatment, all-caps micro-label system, or near-black/acid-green default is used.

All three concepts use real PhysioCare content, keep safety information legible, and treat measurements as evidence for therapist review. The user reconfirmed A after the redesign; B and C remain comparison alternatives, not selected visual directions. C may still inform the live camera workspace at S5 if the layout mockups support it.
