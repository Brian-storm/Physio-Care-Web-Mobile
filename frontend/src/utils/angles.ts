/* PhysioCare — 2D joint and alignment calculations from pose landmarks. */

/**
 * Calculate the smaller angle at point b formed by points a-b-c.
 *
 * Callers should provide coordinates in a consistent, aspect-corrected image
 * space (for example, x normalized by video height and y normalized by video
 * height). The result is an image-plane angle, not a calibrated 3D joint angle.
 *
 * @param a - First point defining one side of the angle.
 * @param b - Vertex of the angle.
 * @param c - Third point defining the other side of the angle.
 * @returns Angle in degrees in the range 0–180.
 */
export function calculateAngle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return angle;
}

/** Knee flexion angle: hip-knee-ankle */
export function calculateKneeAngle(
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  ankle: { x: number; y: number }
): number {
  return calculateAngle(hip, knee, ankle);
}

/** Hip flexion angle: shoulder-hip-knee */
export function calculateHipAngle(
  shoulder: { x: number; y: number },
  hip: { x: number; y: number },
  knee: { x: number; y: number }
): number {
  return calculateAngle(shoulder, hip, knee);
}

/** Hip-knee angle (alias for consistency) */
export function calculateHipKneeAngle(
  shoulder: { x: number; y: number },
  hip: { x: number; y: number },
  knee: { x: number; y: number }
): number {
  return calculateAngle(shoulder, hip, knee);
}

/**
 * Torso lean angle from vertical.
 * Calculated from the shoulder-hip segment relative to the vertical axis.
 * In screen coordinates (y-down), uses |dy| so standing upright = 0°.
 */
export function calculateTorsoAngle(
  shoulder: { x: number; y: number },
  hip: { x: number; y: number }
): number {
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  const radians = Math.atan2(Math.abs(dx), Math.abs(dy));
  return (radians * 180.0) / Math.PI;
}

/**
 * Estimate inward knee deviation from the hip-to-ankle line in a frontal view.
 *
 * The knee's expected x position is interpolated along the hip-to-ankle line at
 * the knee's relative vertical position. Deviation is measured toward the
 * body's center and normalized by hip-to-ankle length, making the result
 * dimensionless and less dependent on image scale.
 *
 * This remains a 2D approximation and is meaningful only when the person is
 * reasonably front-facing and the hip, knee, and ankle are visible.
 *
 * @param hip - Hip point for one side.
 * @param knee - Knee point for the same side.
 * @param ankle - Ankle point for the same side.
 * @param bodyCenterX - Horizontal midpoint between the left and right hips.
 * @returns Non-negative inward deviation divided by leg-segment length.
 */
export function calculateKneeValgus(
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  ankle: { x: number; y: number },
  bodyCenterX: number
): number {
  const verticalSpan = ankle.y - hip.y;
  const legLength = Math.hypot(ankle.x - hip.x, ankle.y - hip.y);

  // Degenerate or nearly coincident points cannot provide a useful alignment.
  if (Math.abs(verticalSpan) < 1e-6 || legLength < 1e-6) return 0;

  const kneePositionOnLeg = Math.min(
    1,
    Math.max(0, (knee.y - hip.y) / verticalSpan)
  );
  const expectedKneeX = hip.x + (ankle.x - hip.x) * kneePositionOnLeg;
  const directionTowardCenter = Math.sign(bodyCenterX - hip.x);

  // If the hip is exactly on the centerline, there is no reliable inward
  // direction for this side in the 2D image.
  if (directionTowardCenter === 0) return 0;

  const inwardOffset = (knee.x - expectedKneeX) * directionTowardCenter;
  return Math.max(0, inwardOffset) / legLength;
}
