import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pypinyin import lazy_pinyin, Style

from backend.database import get_db
from backend.models import WordLibrary
from backend.schemas import WordOut, WordBatchIn, WordUpdateIn

router = APIRouter(prefix="/api/words", tags=["words"])


def _get_pinyin(character: str) -> str:
    """获取汉字拼音，多字用空格拼接。"""
    return " ".join(lazy_pinyin(character, style=Style.TONE))


@router.get("", response_model=list[WordOut])
def list_words(
    search: Optional[str] = None,
    learn_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(WordLibrary).filter(WordLibrary.is_active == 1)
    if search:
        query = query.filter(WordLibrary.character.contains(search))
    if learn_date:
        query = query.filter(WordLibrary.learn_date == learn_date)
    return query.order_by(WordLibrary.add_time.desc()).all()


@router.post("/batch", response_model=list[WordOut])
def batch_add_words(payload: WordBatchIn, db: Session = Depends(get_db)):
    characters = [c.strip() for c in payload.characters.split() if c.strip()]
    if not characters:
        raise HTTPException(status_code=400, detail="未提供任何汉字")

    added = []
    for character in characters:
        existing = (
            db.query(WordLibrary)
            .filter(WordLibrary.character == character, WordLibrary.is_active == 1)
            .first()
        )
        if existing:
            continue
        word = WordLibrary(
            character=character,
            pinyin=_get_pinyin(character),
            learn_date=payload.learn_date,
        )
        db.add(word)
        added.append(word)

    db.commit()
    for word in added:
        db.refresh(word)
    return added


@router.put("/{word_id}", response_model=WordOut)
def update_word(word_id: int, payload: WordUpdateIn, db: Session = Depends(get_db)):
    word = db.query(WordLibrary).filter(WordLibrary.id == word_id, WordLibrary.is_active == 1).first()
    if not word:
        raise HTTPException(status_code=404, detail="字不存在")
    if payload.learn_date is not None:
        word.learn_date = payload.learn_date
    db.commit()
    db.refresh(word)
    return word


@router.delete("/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(WordLibrary).filter(WordLibrary.id == word_id, WordLibrary.is_active == 1).first()
    if not word:
        raise HTTPException(status_code=404, detail="字不存在")
    word.is_active = 0
    db.commit()
    return {"ok": True}


@router.get("/random", response_model=list[WordOut])
def random_words(count: int = 10, db: Session = Depends(get_db)):
    all_words = db.query(WordLibrary).filter(WordLibrary.is_active == 1).all()
    if not all_words:
        return []
    count = min(count, len(all_words))
    return random.sample(all_words, count)
