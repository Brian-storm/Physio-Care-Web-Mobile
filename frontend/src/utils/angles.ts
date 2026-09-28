/* PhysioCare — 3D joint angle calculations using vector dot product and atan2 */

/**
 * Calculate the angle at point b formed by vectors a-b-c.
 * Uses atan2 for full 360-degree precision, clamped to 0-180.
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
 * Knee valgus (knee collapse inward) magnitude.
 * Detected when hip-to-knee and knee-to-ankle vectors are in opposite directions on the X-axis.
 */
export function calculateKneeValgus(
  hip: { x: number; y: number },
  knee: { x: number; y: number },
  ankle: { x: number; y: number }
): number {
  const kneeToHipX = hip.x - knee.x;
  const kneeToAnkleX = ankle.x - knee.x;
  const valgus = (kneeToHipX * kneeToAnkleX < 0)
    ? Math.abs(kneeToHipX - kneeToAnkleX)
    : 0;
  return valgus;
}