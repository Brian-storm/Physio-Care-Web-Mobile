# MediaPipe Pose Analysis in the Live Exercise Session

This document explains how the frontend uses MediaPipe Pose Landmarker in
`frontend/src/components/session/LiveExerciseAnalysis.tsx` to analyze a live
camera view. It is intended as a code-oriented introduction to the data flow
from webcam frame to on-screen squat feedback.

## The main idea

MediaPipe estimates body landmark positions in a video frame. The PhysioCare
frontend passes selected landmarks to its own `SquatEngine`, which derives
squat phases, repetition counts, angles, form score, and risk score.

In short:

> MediaPipe estimates where the body is. `SquatEngine` interprets those
> positions for this squat experience.

MediaPipe does not count repetitions or produce the form and risk scores shown
in the side panel. Those are application logic in
`frontend/src/utils/exerciseEngine.ts`.

## Data flow

```text
Browser webcam
    ↓
useCamera() → HTMLVideoElement
    ↓
usePose() → MediaPipe Pose Landmarker
    ↓
33 pose landmarks for a detected person
    ├──→ canvas skeleton and angle overlay
    └──→ selected shoulder, hip, knee, ankle landmarks
              ↓
          SquatEngine.update()
              ↓
          exerciseState → live metrics panel
```

### 1. The camera provides a video element

`LiveExerciseAnalysis` calls `useCamera()` from
`frontend/src/hooks/useCamera.ts`. The hook requests webcam permission using the
browser's `getUserMedia` API, attaches the resulting stream to the component's
`<video>` element, and reports whether the video is ready.

The `videoRef` returned by the hook is attached to that video element. The
component waits for `cameraReady` before initializing pose detection. If camera
access fails, it renders a camera error view instead of the analysis workspace.

### 2. MediaPipe is initialized once

When the camera is ready, the component calls `initPose()` from
`frontend/src/hooks/usePose.ts`. That hook delegates initialization to
`initPoseDetector()` in `frontend/src/services/poseService.ts`.

The service dynamically loads `@mediapipe/tasks-vision`, resolves the Vision
WASM runtime, and creates a `PoseLandmarker` with these options:

- **Running mode:** `VIDEO`, for processing a sequence of video frames.
- **Number of poses:** `1`, because this experience analyzes one person.
- **Delegate:** `GPU` is requested for inference.
- **Detection and tracking confidence thresholds:** both set to `0.5`.

The MediaPipe runtime and model are fetched from URLs in `poseService.ts`. The
camera frames are processed by the browser; this component does not send video
frames to the PhysioCare backend.

### 3. The animation loop processes frames

After both the camera and pose detector are ready, `LiveExerciseAnalysis`
starts `processFrame()` using `requestAnimationFrame`. The loop:

1. Reads the video and canvas elements from their refs.
2. Calls `detectPose(video, performance.now())` for the current frame.
3. Uses a returned pose if it contains at least 33 landmarks.
4. Updates the squat engine and paints the canvas overlay.
5. Schedules itself again for the next animation frame.

`performance.now()` provides a monotonic timestamp for the video detector.
When no pose is found for a frame, the component skips that frame's engine and
drawing updates and continues the loop.

### 4. MediaPipe returns body landmarks

The service calls MediaPipe's `detectForVideo(video, timestamp)`, takes the
first detected pose, and maps its landmarks to PhysioCare's `Landmark` type in
`frontend/src/types/pose.ts`:

```ts
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
```

A full pose contains 33 landmarks. The `x` and `y` values are normalized image
coordinates rather than pixels: approximately, `(0, 0)` is the top-left of the
image and `(1, 1)` is its bottom-right. `z` describes relative depth; it is not
a distance in meters. `visibility`, when provided, indicates how visible the
landmark is to the model.

The index-to-name reference is `LANDMARK_MAP` in `frontend/src/types/pose.ts`.
Indices used by the live squat experience include:

| Index | Landmark |
| ---: | --- |
| 11, 12 | Left and right shoulders |
| 23, 24 | Left and right hips |
| 25, 26 | Left and right knees |
| 27, 28 | Left and right ankles |

### 5. The component uses landmarks in two ways

#### Canvas overlay

`drawSkeleton()` in `LiveExerciseAnalysis.tsx` converts normalized coordinates
to canvas pixels:

```ts
pixelX = landmark.x * videoWidth;
pixelY = landmark.y * videoHeight;
```

It draws the connections listed in `SKELETON_CONNECTIONS` and adds dots for the
landmarks. Angle labels are positioned near the joint groups but use the same
filtered values returned by `SquatEngine` as the side panel, so the two displays
stay in sync.

#### Squat analysis

`processFrame()` selects the shoulder, hip, knee, and ankle landmarks (including
visibility values) from the 33-point pose and passes them, together with the
video aspect ratio, to:

```ts
engineRef.current.update(landmarkSet, videoWidth / videoHeight)
```

`SquatEngine` in `frontend/src/utils/exerciseEngine.ts` computes angles and
tracks the squat state machine. Its returned snapshot is stored in React state
as `exerciseState`, which updates the phase, rep/set counts, angle values,
scores, and alert in the side panel.

The engine is held in a React ref because it has mutable frame-to-frame state
(such as its current phase and repetition count). React state is used for the
snapshot that needs to be displayed and refreshed in the UI.

## What the displayed values mean

- **Phase and repetitions:** Produced by the squat state machine in
  `SquatEngine` from changes in the calculated knee angle.
- **Joint angles:** Calculated from the selected landmark coordinates using the
  project's functions in `frontend/src/utils/angles.ts`.
- **Form and risk scores:** Heuristic values calculated by `SquatEngine` from
  its angle and knee-valgus checks.
- **Flagged alert:** Shown when the engine's risk rules set `isFlagged`.

These are application-generated feedback values, not a medical diagnosis or
clinical measurement. In particular, MediaPipe's landmark coordinates are
estimates, and the angle calculations in this flow use 2D screen coordinates.

## How `SquatEngine` calculates a squat

The detailed implementation is in `frontend/src/utils/exerciseEngine.ts`. The
component calls `SquatEngine.update(landmarkSet, aspectRatio)` for each detected
pose with at least 33 landmarks.

### Aspect-corrected, visibility-weighted angles

MediaPipe's x and y coordinates are normalized independently to the image
width and height. Treating both values as equal-distance coordinates can skew
angles when the camera image is not square. The engine scales x by
`videoWidth / videoHeight` before measuring so x and y use the same image-space
scale.

The engine calculates angles for the left and right sides independently; it
does not average the two knees or ankles into a synthetic joint. It weights
each side's measurement by the lowest visibility among the landmarks used for
that measurement, ignores a side below `0.5` visibility, then averages the
remaining measurements. A frame without a sufficiently visible knee/hip/ankle
set is ignored and breaks the current phase-debounce streak.

Per-frame measurements are smoothed with an exponential moving average
(`alpha = 0.35`) before display and phase detection. This reduces small
frame-to-frame jumps at the cost of some response delay. The resulting angles
are:

- **Knee angle:** The angle at the knee formed by hip–knee–ankle. A relatively
  straight leg is near 180°; bending the knee makes the angle smaller.
- **Hip angle:** The angle at the hip formed by shoulder–hip–knee.
- **Torso lean:** The shoulder-to-hip line measured from vertical, where an
  upright torso is near 0°.

The angle helpers are in `frontend/src/utils/angles.ts`. These remain 2D
image-plane estimates: aspect correction does not calibrate the camera or
remove perspective distortion, and MediaPipe's z coordinate is not used.

Knee valgus is estimated per side by comparing the knee's x position with the
interpolated hip-to-ankle line at the knee's height. Inward deviation is divided
by hip-to-ankle length, then the larger visible-side estimate is used. This
estimate is meaningful primarily when the person faces the camera; it is not a
3D knee-alignment measurement.

**Camera-view limitation:** a side-on view is generally more informative for
the projected hip/knee flexion angles, while a frontal view is needed to see
inward knee movement. A single 2D camera angle cannot reliably measure both
planes at once; camera position and perspective can still make the estimates
inaccurate.

### Intended phase and repetition rules

The engine evaluates these conditions on each frame:

| Transition | Condition sustained for 3 valid frames |
| --- | --- |
| `idle` → `descending` | Knee angle below 160° |
| `descending` → `bottom` | Knee angle at or below 110° |
| `descending` → `idle` (aborted/shallow attempt) | Knee angle at or above 170° |
| `bottom` → `ascending` | Knee angle at or above 120° |
| `ascending` → `completed` | Knee angle at or above 160° |
| `ascending` → `bottom` | Knee angle at or below 100° |

The phase thresholds use gaps (hysteresis), so small movements around a
threshold do not immediately reverse the phase. Each transition requires three
consecutive valid frames; invalid/low-visibility frames reset that count. A
completed repetition increments `repCount` and exposes `completed` for that
frame; the following valid frame begins again from `idle`.

### Angle targets, form score, and risk score

For each update, `SquatEngine` returns three angle values with display targets
and status bands:

| Angle | Display target | `under` | `over` | Otherwise |
| --- | ---: | --- | --- | --- |
| Knee flexion | 90° | Below 85° | Above 100° | `target` |
| Hip flexion | 75° | Below 70° | Above 85° | `target` |
| Torso lean | 15° | Below 10° | Above 30° | `target` |

The **form score** is recalculated from 100 on every valid frame. It deducts 15
points when torso lean is above 40°, otherwise 5 points when above 30°, and 20
points when normalized knee-valgus deviation is above `0.1`. The result is
clamped to a minimum of zero. It is not averaged over the repetition.

The **risk score** is also recalculated per valid frame: normalized knee-valgus
deviation above `0.18` adds 40, torso lean above 50° adds 30, and a knee angle
below 60° adds 20. The sum is capped at 100. The alert flag is true only when
the score is greater than 75. These thresholds and scores are code heuristics,
not validated clinical decision rules.

The displayed **set count** is derived from reps rather than managed as a
separate set state:

```text
min(floor(repCount / 12) + 1, 3)
```

That means it starts at set 1, advances after each 12 counted reps, and stops
at set 3. The live page's reset button clears the engine; it does not save the
counts.

## Current implementation notes

- The service returns the first detected pose; the detector is configured for
  one person.
- `poseService.ts` currently sets the returned `PoseLandmarks.score` to `1`
  rather than deriving an overall score from MediaPipe confidence values.
- The engine treats an omitted visibility value as fully visible for
  compatibility. When MediaPipe supplies visibility values, low-confidence
  sides are excluded from angle measurements.
- Knee-valgus estimation assumes a reasonably frontal view; camera placement
  and perspective can still affect these 2D estimates.
- The reset button resets the in-memory `SquatEngine` and refreshes the visible
  state.
- The result link opens a demo result page. The live values shown by this
  component are not saved by this flow.

## Source files

| File | Responsibility |
| --- | --- |
| `frontend/src/components/session/LiveExerciseAnalysis.tsx` | Coordinates camera, detection loop, canvas, engine, and UI |
| `frontend/src/hooks/useCamera.ts` | Requests and cleans up the webcam stream |
| `frontend/src/hooks/usePose.ts` | Exposes detector initialization and per-frame detection to React |
| `frontend/src/services/poseService.ts` | Loads MediaPipe and adapts its output to PhysioCare types |
| `frontend/src/utils/exerciseEngine.ts` | Computes squat state and exercise metrics |
| `frontend/src/utils/angles.ts` | Provides the 2D angle and knee-valgus calculations |
| `frontend/src/types/pose.ts` | Defines landmark and exercise-state types and landmark indices |
