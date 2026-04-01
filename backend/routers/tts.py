import hashlib
from pathlib import Path

import edge_tts
from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/tts", tags=["tts"])

VOICE = "zh-CN-XiaoxiaoNeural"  # 普通话女声
CACHE_DIR = Path(__file__).parent.parent / "uploads" / "tts"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/{text}")
async def text_to_speech(text: str):
    """生成普通话语音，缓存到本地"""
    key = hashlib.md5(text.encode()).hexdigest()
    cache_file = CACHE_DIR / f"{key}.mp3"

    if not cache_file.exists():
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(cache_file))

    return FileResponse(
        str(cache_file),
        media_type="audio/mpeg",
        filename=f"{text}.mp3",
    )
