from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 declarative base.

    Centralizes metadata for:
    • ORM models
    • Alembic autogeneration
    • Type-checker correctness
    """
    pass
