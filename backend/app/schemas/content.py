from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import Timestamped

ContentType = Literal["text", "video", "audio", "pdf", "document", "quiz"]


class ContentBase(BaseModel):
    module_id: str
    type: ContentType
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    file_url: str | None = None
    external_url: str | None = None
    order_index: int = Field(default=0, ge=0)
    category: str = "reading"
    instructions: str | None = None
    downloadable: bool = False
    response_type: str | None = None
    duration: int = Field(default=0, ge=0)
    institute_id: str | None = None

    @model_validator(mode="after")
    def validate_urls(self) -> "ContentBase":
        if self.type == "text" and self.file_url:
            raise ValueError("Text content cannot include file_url.")
        if self.type == "quiz" and self.file_url:
            raise ValueError("Quiz content cannot include file_url.")
        return self


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    type: ContentType | None = None
    description: str | None = None
    external_url: str | None = None
    order_index: int | None = Field(default=None, ge=0)
    category: str | None = None
    instructions: str | None = None
    downloadable: bool | None = None
    response_type: str | None = None
    duration: int | None = Field(default=None, ge=0)
    institute_id: str | None = None
    replace_file: bool = False


class ContentRead(Timestamped):
    content_id: str
    institute_id: str
    module_id: str
    created_by: str | None
    title: str
    type: str
    description: str | None = None
    file_url: str | None = None
    external_url: str | None = None
    resolved_url: str | None = None
    order_index: int
    category: str = "reading"
    instructions: str | None = None
    downloadable: bool = False
    response_type: str | None = None
    duration: int = 0


class ContentDeleteResponse(BaseModel):
    message: str
