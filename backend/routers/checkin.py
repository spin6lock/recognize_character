from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import CheckinRecord, AnswerDetail
from backend.schemas import (
    CheckinRecordIn,
    CheckinRecordOut,
    CheckinRecordDetailOut,
    StreakOut,
)

router = APIRouter(prefix="/api/checkin", tags=["checkin"])


@router.get("", response_model=list[CheckinRecordOut])
def list_checkins(db: Session = Depends(get_db)):
    return db.query(CheckinRecord).order_by(CheckinRecord.checkin_date.desc()).all()


@router.post("", response_model=CheckinRecordOut)
def create_checkin(payload: CheckinRecordIn, db: Session = Depends(get_db)):
    record = CheckinRecord(
        checkin_date=payload.checkin_date,
        challenge_count=payload.challenge_count,
        correct_count=payload.correct_count,
        wrong_count=payload.wrong_count,
        total_rounds=payload.total_rounds,
        duration=payload.duration,
    )
    db.add(record)
    db.flush()  # 获取 record.id

    for detail_in in payload.details:
        detail = AnswerDetail(
            record_id=record.id,
            character=detail_in.character,
            is_correct=detail_in.is_correct,
            wrong_times=detail_in.wrong_times,
            round_correct=detail_in.round_correct,
        )
        db.add(detail)

    db.commit()
    db.refresh(record)
    return record


@router.get("/streak", response_model=StreakOut)
def get_streak(db: Session = Depends(get_db)):
    today = date.today()
    all_dates = {
        row.checkin_date
        for row in db.query(CheckinRecord.checkin_date).all()
    }

    checked_in_today = today.isoformat() in all_dates

    streak_days = 0
    cursor = today
    while cursor.isoformat() in all_dates:
        streak_days += 1
        cursor -= timedelta(days=1)

    return StreakOut(streak_days=streak_days, checked_in_today=checked_in_today)


@router.get("/{record_id}", response_model=CheckinRecordDetailOut)
def get_checkin_detail(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CheckinRecord).filter(CheckinRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record
