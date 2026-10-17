import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

env_path = Path(__file__).resolve().parent.parent.parent / '.env'

# 👇 暴力檢查區 👇
print("=== 檢查 .env 檔案 ===", flush=True)
print(f"檔案是否存在: {env_path.exists()}", flush=True)
if env_path.exists():
    print(f"讀取到的實際檔案內容:\n{env_path.read_text(encoding='utf-8')}", flush=True)
else:
    # 如果檔案不存在，印出這個資料夾裡到底有哪些檔案
    print(f"該資料夾裡的檔案列表: {os.listdir(env_path.parent)}", flush=True)
print("=======================", flush=True)

load_dotenv(dotenv_path=env_path, override=True)

def generate_session_summary(
    total_reps: int,
    total_sets: int,
    avg_knee_angle: float,
    avg_torso_lean: float,
    form_score: int,
    flag_count: int,
    pain_score: int | None = None,
) -> str:
    
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"📁 讀取路徑: {env_path}", flush=True)
    print(f"🔑 目前讀到的 Key: {api_key[:10] if api_key else 'None'}", flush=True)
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    
    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    
    # 建立 Gemini 客戶端
    client = genai.Client(api_key=api_key)

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

    # 呼叫 Gemini API
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="你是一位嚴謹、專業的物理治療師助手。",
            temperature=0.4,
        )
    )
    
    return response.text.strip()