/* PhysioCare — Prepare measured session metrics and request an AI observation. */
export interface SessionReportStats {
  frameCount: number;
  kneeSum: number;
  torsoSum: number;
  formScoreSum: number;
  flagCount: number;
}

export interface SessionReportPayload {
  total_reps: number;
  total_sets: number;
  avg_knee_angle: number;
  avg_torso_lean: number;
  form_score: number;
  flag_count: number;
  pain_score: number;
}

/**
 * Prepare observed averages and cumulative counts from the exercise display.
 * @param stats - Accumulated numerical frame measurements.
 * @param repCount - Completed repetitions in the current set.
 * @param setCount - One-based current set index, including an incomplete set.
 * @param painInput - Entered pain score, or null when the prompt is cancelled.
 * @param targetReps - Number of repetitions that completes one set.
 * @returns Report metrics, or null on cancellation.
 */
export function prepareSessionReport(
  stats: SessionReportStats,
  repCount: number,
  setCount: number,
  painInput: string | null,
  targetReps: number,
): SessionReportPayload | null {
  if (painInput === null) return null;
  if (stats.frameCount < 1) throw new Error('尚未有動作分析數據，請先完成訓練再生成摘要。');
  const painScore = Number(painInput);
  if (!painInput.trim() || !Number.isInteger(painScore) || painScore < 0 || painScore > 10) {
    throw new Error('請輸入0至10之間的整數疼痛分數。');
  }
  const totalReps = (setCount - 1) * targetReps + repCount;
  return {
    total_reps: totalReps,
    total_sets: Math.floor(totalReps / targetReps),
    avg_knee_angle: stats.kneeSum / stats.frameCount,
    avg_torso_lean: stats.torsoSum / stats.frameCount,
    form_score: Math.round(stats.formScoreSum / stats.frameCount),
    flag_count: stats.flagCount,
    pain_score: painScore,
  };
}

/** Send numerical metrics only and require a complete summary response. */
export async function requestSessionReport(apiBaseUrl: string, payload: SessionReportPayload): Promise<string> {
  const response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/api/v1/report/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    redirect: 'error',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(35000),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'
      ? data.detail : `報告服務回應錯誤（HTTP ${response.status}）`;
    throw new Error(detail);
  }
  if (typeof data !== 'object' || data === null || !('summary' in data) || typeof data.summary !== 'string' || !data.summary.trim()) {
    throw new Error('報告服務未能傳回完整摘要，請稍後再試。');
  }
  return data.summary.trim();
}
