from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    analyses = relationship("Analysis", back_populates="owner")


class Analysis(Base):
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)
    resume_name = Column(String)
    match_score = Column(Float)
    estimated_days = Column(Integer)

    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="analyses")
