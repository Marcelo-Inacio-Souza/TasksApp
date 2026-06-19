from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------- Board ----------

class BoardCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    company_id: UUID | None = None


class BoardUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID | None
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BoardWithColumnsRead(BoardRead):
    columns: list["BoardColumnRead"] = []


# ---------- Board Column ----------

class BoardColumnCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = Field(default="#38bdf8", max_length=24)
    is_done_column: bool = False


class BoardColumnUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    color: str | None = Field(default=None, max_length=24)
    is_done_column: bool | None = None


class BoardColumnReorderItem(BaseModel):
    id: UUID
    position: int = Field(ge=0)


class BoardColumnReorderRequest(BaseModel):
    columns: list[BoardColumnReorderItem]


class BoardColumnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    board_id: UUID
    name: str
    color: str
    position: int
    is_done_column: bool


class BoardColumnWithTasksRead(BoardColumnRead):
    tasks: list["TaskRead"] = []


# ---------- Task ----------

class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=220)
    description: str | None = Field(default=None, max_length=8000)
    column_id: UUID
    priority: str = Field(default="normal", max_length=32)
    due_at: datetime | None = None
    assignee_ids: list[UUID] = Field(default_factory=list)
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class TaskUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=220)
    description: str | None = Field(default=None, max_length=8000)
    priority: str | None = Field(default=None, max_length=32)
    due_at: datetime | None = None
    custom_fields: dict[str, Any] | None = None


class TaskMoveRequest(BaseModel):
    column_id: UUID
    position: int = Field(ge=0)


class TaskAssigneesRequest(BaseModel):
    assignee_ids: list[UUID]


class TaskAssigneeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    avatar_url: str | None


class TaskCommentCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class TaskCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    author_id: UUID
    author_name: str
    body: str
    created_at: datetime


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    board_id: UUID
    column_id: UUID
    title: str
    description: str | None
    priority: str
    position: int
    due_at: datetime | None
    completed_at: datetime | None
    custom_fields: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    assignees: list[TaskAssigneeRead] = []


BoardWithColumnsRead.model_rebuild()
BoardColumnWithTasksRead.model_rebuild()