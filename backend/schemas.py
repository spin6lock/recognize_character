from typing import Optional
from pydantic import BaseModel


# ── 字库 ──────────────────────────────────────────────

class WordOut(BaseModel):
    id: int
    character: str
    pinyin: str
    learn_date: Optional[str]
    add_time: str
    is_active: int

    model_config = {"from_attributes": True}


class WordBatchIn(BaseModel):
    characters: str          # 空格分隔的汉字字符串
    learn_date: Optional[str] = None


class WordUpdateIn(BaseModel):
    learn_date: Optional[str] = None


# ── 答题明细 ──────────────────────────────────────────

class AnswerDetailIn(BaseModel):
    character: str
    is_correct: int
    wrong_times: int
    round_correct: int


class AnswerDetailOut(BaseModel):
    id: int
    record_id: int
    character: str
    is_correct: int
    wrong_times: int
    round_correct: int

    model_config = {"from_attributes": True}


# ── 打卡记录 ──────────────────────────────────────────

class CheckinRecordIn(BaseModel):
    checkin_date: str
    challenge_count: int
    correct_count: int
    wrong_count: int
    total_rounds: int
    duration: int
    details: list[AnswerDetailIn]


class CheckinRecordOut(BaseModel):
    id: int
    checkin_date: str
    challenge_count: int
    correct_count: int
    wrong_count: int
    total_rounds: int
    duration: int

    model_config = {"from_attributes": True}


class CheckinRecordDetailOut(CheckinRecordOut):
    details: list[AnswerDetailOut]


class StreakOut(BaseModel):
    streak_days: int
    checked_in_today: bool


# ── 提示录音 ──────────────────────────────────────────

class PromptAudioOut(BaseModel):
    id: int
    type: str
    audio_url: str
    create_time: str

    model_config = {"from_attributes": True}
