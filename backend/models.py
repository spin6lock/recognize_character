from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class WordLibrary(Base):
    __tablename__ = "word_library"

    id = Column(Integer, primary_key=True, autoincrement=True)
    character = Column(String, nullable=False)
    pinyin = Column(String, nullable=False)
    learn_date = Column(String, nullable=True)
    add_time = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    is_active = Column(Integer, default=1)


class CheckinRecord(Base):
    __tablename__ = "checkin_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    checkin_date = Column(String, nullable=False)
    challenge_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    total_rounds = Column(Integer, default=0)
    duration = Column(Integer, default=0)

    details = relationship("AnswerDetail", back_populates="record", cascade="all, delete-orphan")


class AnswerDetail(Base):
    __tablename__ = "answer_details"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("checkin_records.id"), nullable=False)
    character = Column(String, nullable=False)
    is_correct = Column(Integer, default=0)
    wrong_times = Column(Integer, default=0)
    round_correct = Column(Integer, default=0)

    record = relationship("CheckinRecord", back_populates="details")


class PromptAudio(Base):
    __tablename__ = "prompt_audio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String, nullable=False)  # correct / wrong / complete
    audio_url = Column(String, nullable=False)
    create_time = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
