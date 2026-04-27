from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Content(Base, TimestampMixin):
    __tablename__ = "contents"

    content_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    institute_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("institutes.institute_id"), nullable=False, index=True
    )
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.module_id"), nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    external_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    module = relationship("Module", back_populates="contents")
    profile = relationship("ContentProfile", back_populates="content", uselist=False, cascade="all, delete-orphan")
    creator = relationship("User")

    @property
    def category(self) -> str:
        return self.profile.category if self.profile is not None else self.type

    @property
    def body_text(self) -> str | None:
        return self.description if self.description is not None else (
            self.profile.body_text if self.profile is not None else None
        )

    @property
    def instructions(self) -> str | None:
        return self.profile.instructions if self.profile is not None else None

    @property
    def downloadable(self) -> bool:
        return self.profile.downloadable if self.profile is not None else False

    @property
    def response_type(self) -> str | None:
        return self.profile.response_type if self.profile is not None else None

    @property
    def resolved_url(self) -> str | None:
        return self.file_url or self.external_url or self.url
