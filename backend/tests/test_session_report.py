"""PhysioCare — Session report API error and CORS behavior tests."""

from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.main import app

CLIENT = TestClient(app, raise_server_exceptions=False)
ORIGIN = "http://localhost:3000"
PAYLOAD = {
    "total_reps": 8,
    "total_sets": 2,
    "avg_knee_angle": 90.0,
    "avg_torso_lean": 30.0,
    "form_score": 85,
    "flag_count": 0,
    "pain_score": 2,
}


def test_session_report_success_includes_cors_header() -> None:
    """Return the generated summary with the requesting local origin allowed."""
    with patch("app.api.endpoints.generate_session_summary", return_value="測試摘要"):
        response = CLIENT.post(
            "/api/v1/report/session",
            headers={"Origin": ORIGIN},
            json=PAYLOAD,
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ORIGIN
    assert response.json() == {"summary": "測試摘要"}


def test_provider_failure_is_visible_and_keeps_cors_header() -> None:
    """Expose a sanitized service error instead of a browser CORS failure."""
    with patch(
        "app.api.endpoints.generate_session_summary",
        side_effect=httpx.ConnectError("simulated provider failure"),
    ):
        response = CLIENT.post(
            "/api/v1/report/session",
            headers={"Origin": ORIGIN},
            json=PAYLOAD,
        )

    assert response.status_code == 503
    assert response.headers["access-control-allow-origin"] == ORIGIN
    assert response.json()["detail"] == "Could not reach OpenRouter; try again shortly."


def test_rejected_api_key_is_reported_without_losing_cors() -> None:
    """Translate OpenRouter authentication errors to a safe, actionable response."""
    request = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
    upstream_response = httpx.Response(401, request=request)
    provider_error = httpx.HTTPStatusError(
        "simulated unauthorized response",
        request=request,
        response=upstream_response,
    )
    with patch(
        "app.api.endpoints.generate_session_summary",
        side_effect=provider_error,
    ):
        response = CLIENT.post(
            "/api/v1/report/session",
            headers={"Origin": ORIGIN},
            json=PAYLOAD,
        )

    assert response.status_code == 502
    assert response.headers["access-control-allow-origin"] == ORIGIN
    assert response.json()["detail"] == "OpenRouter rejected the API key; verify LLM_API_KEY."


def test_unexpected_server_error_still_includes_cors_header() -> None:
    """Keep CORS headers on unexpected 500 responses as well."""
    with patch(
        "app.api.endpoints.generate_session_summary",
        side_effect=ValueError("simulated internal failure"),
    ):
        response = CLIENT.post(
            "/api/v1/report/session",
            headers={"Origin": ORIGIN},
            json=PAYLOAD,
        )

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == ORIGIN
