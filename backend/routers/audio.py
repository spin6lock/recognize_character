import random
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import PromptAudio
from backend.schemas import PromptAudioOut

router = APIRouter(prefix="/api/audio", tags=["audio"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads" / "audio"
ALLOWED_TYPES = {"correct", "wrong", "complete"}


@router.get("/{audio_type}", response_model=list[PromptAudioOut])
def list_audio(audio_type: str, db: Session = Depends(get_db)):
    if audio_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="类型无效，应为 correct/wrong/complete")
    return db.query(PromptAudio).filter(PromptAudio.type == audio_type).all()


@router.get("/{audio_type}/random", response_model=PromptAudioOut | None)
def random_audio(audio_type: str, db: Session = Depends(get_db)):
    if audio_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="类型无效，应为 correct/wrong/complete")
    audios = db.query(PromptAudio).filter(PromptAudio.type == audio_type).all()
    if not audios:
        return None
    return random.choice(audios)


@router.post("/upload", response_model=PromptAudioOut)
async def upload_audio(
    type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="类型无效，应为 correct/wrong/complete")

    suffix = Path(file.filename).suffix if file.filename else ".webm"
    filename = f"{type}_{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / filename

    async with aiofiles.open(file_path, "wb") as output_file:
        content = await file.read()
        await output_file.write(content)

    audio_url = f"/uploads/audio/{filename}"
    audio = PromptAudio(type=type, audio_url=audio_url)
    db.add(audio)
    db.commit()
    db.refresh(audio)
    return audio


@router.delete("/{audio_id}")
def delete_audio(audio_id: int, db: Session = Depends(get_db)):
    audio = db.query(PromptAudio).filter(PromptAudio.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="录音不存在")

    file_path = UPLOAD_DIR / Path(audio.audio_url).name
    if file_path.exists():
        file_path.unlink()

    db.delete(audio)
    db.commit()
    return {"ok": True}
