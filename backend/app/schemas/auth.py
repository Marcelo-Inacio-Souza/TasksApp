from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    hierarchy_level: int
    permissions: dict[str, bool]
    is_system: bool
    is_active: bool


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID | None
    role_id: UUID
    role: RoleRead
    name: str
    email: EmailStr
    avatar_url: str | None
    must_change_password: bool
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class BootstrapMasterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    email: EmailStr
    role_code: str = Field(min_length=2, max_length=80)
    company_id: UUID | None = None
    is_active: bool = True


class UserCreatedResponse(BaseModel):
    user: UserRead
    temporary_password: str
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


UserMe = UserRead
