from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class Run(Base):
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True)
    app_name = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    triggered_by = Column(String(50), default="manual")
    git_commit = Column(String(100))
    overall_status = Column(String(10), nullable=False)
    total_checks = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    duration_seconds = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

    layers = relationship("Layer", back_populates="run", cascade="all, delete-orphan")


class Layer(Base):
    __tablename__ = "layers"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    layer_name = Column(String(100), nullable=False)
    feature_group = Column(String(100))
    status = Column(String(10), nullable=False)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    total = Column(Integer, default=0)

    run = relationship("Run", back_populates="layers")
    test_cases = relationship("TestCase", back_populates="layer", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    layer_id = Column(Integer, ForeignKey("layers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    service = Column(String(100))
    status = Column(String(10), nullable=False)
    status_code = Column(Integer)
    latency_seconds = Column(Float)
    error_message = Column(Text)
    failure_category = Column(String(50))
    category = Column(String(50), default="contract")
    feature_group = Column(String(100))
    routing_pass = Column(Boolean)
    source_attribution_pass = Column(Boolean)
    source_url_pass = Column(Boolean)
    disclaimer_pass = Column(Boolean)
    latency_flag = Column(String(20))

    layer = relationship("Layer", back_populates="test_cases")
