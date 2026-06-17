import secrets
import string
import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.db.session import get_db
from backend.app.models import User
from backend.app.models.entities import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
router = APIRouter()


# ---------- helpers ----------

def _temp_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais invalidas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = uuid.UUID(payload.get("sub", ""))
    except Exception as exc:
        raise credentials_error from exc

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_error
    return user


async def require_master(current_user: User = Depends(get_current_user)) -> User:
    await _load_role(current_user)
    if current_user.role.code != "master":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito.")
    return current_user


async def _load_role(user: User, db: AsyncSession | None = None) -> None:
    """Garante que user.role está carregado (lazy load seguro)."""
    try:
        _ = user.role.code
    except Exception:
        pass


# ---------- schemas ----------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class BootstrapRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    role_code: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---------- utilidade ----------

def _user_dict(user: User) -> dict:
    role = user.role
    return {
        "id": str(user.id),
        "company_id": str(user.company_id) if user.company_id else None,
        "role_id": str(user.role_id),
        "role": {
            "id": str(role.id),
            "code": role.code,
            "name": role.name,
            "hierarchy_level": role.hierarchy_level,
            "permissions": role.permissions,
            "is_system": role.is_system,
            "is_active": role.is_active,
        },
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "must_change_password": user.must_change_password,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    }


async def _get_or_create_role(db: AsyncSession, code: str, name: str, level: int) -> Role:
    result = await db.execute(select(Role).where(Role.code == code))
    role = result.scalar_one_or_none()
    if not role:
        role = Role(
            code=code,
            name=name,
            hierarchy_level=level,
            permissions={},
            is_system=True,
            is_active=True,
        )
        db.add(role)
        await db.flush()
    return role


# ---------- rotas ----------

@router.post("/bootstrap-master", response_model=TokenResponse)
async def bootstrap_master(body: BootstrapRequest, db: AsyncSession = Depends(get_db)):
    """Cria o primeiro usuário master. Bloqueado se já existir algum usuário."""
    count_result = await db.execute(select(func.count()).select_from(User))
    if count_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe um usuario cadastrado. Use o login.",
        )

    role = await _get_or_create_role(db, "master", "Master", 100)

    # Cria roles padrão junto
    default_roles = [
        ("diretor", "Diretor", 90),
        ("gerente", "Gerente", 80),
        ("engenharia", "Engenharia", 70),
        ("analista", "Analista", 60),
        ("assistente", "Assistente", 50),
        ("producao", "Producao", 40),
    ]
    for code, name, level in default_roles:
        await _get_or_create_role(db, code, name, level)

    user = User(
        role_id=role.id,
        name=body.name.strip(),
        email=body.email.strip().lower(),
        hashed_password=hash_password(body.password),
        must_change_password=False,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role"])

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=_user_dict(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    email = form_data.username.strip().lower()
    result = await db.execute(
        select(User).where(User.email == email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha invalidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    await db.refresh(user, ["role"])
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=_user_dict(user))


@router.get("/me")
async def read_current_user(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    await db.refresh(current_user, ["role"])
    return _user_dict(current_user)


@router.get("/roles")
async def list_roles(
    _: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    result = await db.execute(
        select(Role).where(Role.is_active.is_(True)).order_by(Role.hierarchy_level.desc())
    )
    roles = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "code": r.code,
            "name": r.name,
            "hierarchy_level": r.hierarchy_level,
            "permissions": r.permissions,
            "is_system": r.is_system,
            "is_active": r.is_active,
        }
        for r in roles
    ]


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_master), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    result = await db.execute(
        select(User).where(User.is_active.is_(True)).order_by(User.created_at)
    )
    users = result.scalars().all()
    out = []
    for u in users:
        await db.refresh(u, ["role"])
        out.append(_user_dict(u))
    return out


@router.post("/users")
async def create_user(
    body: CreateUserRequest,
    current_user: User = Depends(require_master),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Verifica se e-mail já existe
    existing = await db.execute(select(User).where(User.email == body.email.strip().lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado.")

    # Busca role pelo code
    role_result = await db.execute(select(Role).where(Role.code == body.role_code))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado.")

    temp_pwd = _temp_password()
    user = User(
        role_id=role.id,
        name=body.name.strip(),
        email=body.email.strip().lower(),
        hashed_password=hash_password(temp_pwd),
        must_change_password=True,
        created_by_id=current_user.id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role"])

    return {"user": _user_dict(user), "temporary_password": temp_pwd}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter ao menos 6 caracteres.")

    current_user.hashed_password = hash_password(body.new_password)
    current_user.must_change_password = False
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    await db.refresh(current_user, ["role"])

    return _user_dict(current_user)