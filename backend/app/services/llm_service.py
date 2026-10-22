"""PhysioCare — OpenRouter inference integration."""

import httpx

from app.core.config import settings

OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_session_summary(
    total_reps: int,
    total_sets: int,
    avg_knee_angle: float,
    avg_torso_lean: float,
    form_score: int,
    flag_count: int,
    pain_score: int | None = None,
) -> str:
    """Generate a therapist-facing summary from session metrics.

    Args:
        total_reps: Number of completed repetitions.
        total_sets: Number of completed sets.
        avg_knee_angle: Average knee angle in degrees.
        avg_torso_lean: Average torso lean angle in degrees.
        form_score: Session form score from 0 to 100.
        flag_count: Number of safety alerts triggered.
        pain_score: Patient-reported pain score from 0 to 10, if provided.

    Returns:
        A concise Traditional Chinese summary.

    Raises:
        RuntimeError: If the API key is missing or the response is invalid.
        httpx.HTTPStatusError: If OpenRouter returns an unsuccessful HTTP status.
    """
    api_key = settings.llm_api_key
    if not api_key:
        raise RuntimeError("LLM_API_KEY is not set")

    model_name = settings.llm_model_name

    prompt = f"""請根據以下患者今日的深蹲訓練數據，用繁體中文寫一段 100 字以內的治療師摘要，語氣專業、客觀，指出優點與需要改進的地方。

訓練數據：
- 總次數：{total_reps}
- 總組數：{total_sets}
- 平均膝關節角度：{avg_knee_angle:.1f}°
- 平均軀幹前傾角度：{avg_torso_lean:.1f}°
- 動作品質分數：{form_score}/100
- 觸發警報次數：{flag_count}
- 患者自述疼痛指數：{pain_score if pain_score is not None else '未提供'}/10
"""

    response = httpx.post(
        OPENROUTER_CHAT_COMPLETIONS_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://physio-care.pages.dev",
            "X-OpenRouter-Title": "PhysioCare",
        },
        json={
            "model": model_name,
            "messages": [
                {"role": "system", "content": "你是一位嚴謹、專業的物理治療師助手。"},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        },
        timeout=30.0,
    )
    response.raise_for_status()

    try:
        summary = response.json()["choices"][0]["message"]["content"]
    except (IndexError, KeyError, TypeError) as exc:
        raise RuntimeError("OpenRouter returned an invalid chat completion response") from exc

    if not isinstance(summary, str) or not summary.strip():
        raise RuntimeError("OpenRouter returned an empty session summary")

    return summary.strip()
