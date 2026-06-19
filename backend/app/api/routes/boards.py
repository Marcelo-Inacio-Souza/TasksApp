import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.routes.auth import get_current_user
from backend.app.db.session import get_db
from backend.app.models import User
from backend.app.models.entities import Board, BoardColumn, Task, TaskAssignee, TaskComment
from backend.app.schemas.boards import (
    BoardColumnCreateRequest,
    BoardColumnRead,
    BoardColumnReorderRequest,
    BoardColumnUpdateRequest,
    BoardCreateRequest,
    BoardRead,
    BoardUpdateRequest,
    BoardWithColumnsRead,
    TaskAssigneesRequest,
    TaskCommentCreateRequest,
    TaskCommentRead,
    TaskCreateRequest,
    TaskMoveRequest,
    TaskRead,
    TaskUpdateRequest,
)

router = APIRouter()


# ============================================================
# BOARDS
# ============================================================

@router.get("", response_model=list[BoardRead])
async def list_boards(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[Board]:
    query = select(Board).where(Board.is_active.is_(True)).order_by(Board.created_at)
    if current_user.company_id:
        query = query.where(Board.company_id == current_user.company_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
async def create_board(
    body: BoardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Board:
    company_id = body.company_id or current_user.company_id
    board = Board(
        company_id=company_id,
        name=body.name.strip(),
        description=body.description,
        is_active=True,
    )
    db.add(board)
    await db.flush()

    default_columns = [
        ("Entrada", "#38bdf8", False),
        ("Em andamento", "#f59e0b", False),
        ("Aguardando retorno", "#a78bfa", False),
        ("Concluido", "#34d399", True),
    ]
    for idx, (name, color, is_done) in enumerate(default_columns):
        db.add(
            BoardColumn(
                board_id=board.id,
                name=name,
                color=color,
                position=idx,
                is_done_column=is_done,
            )
        )

    await db.commit()
    await db.refresh(board)
    return board


@router.get("/{board_id}", response_model=BoardWithColumnsRead)
async def get_board(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Board:
    result = await db.execute(
        select(Board)
        .where(Board.id == board_id)
        .options(
            selectinload(Board.columns).selectinload(BoardColumn.tasks).selectinload(Task.assignees).selectinload(TaskAssignee.user)
        )
    )
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Quadro nao encontrado.")
    return board


@router.patch("/{board_id}", response_model=BoardRead)
async def update_board(
    board_id: uuid.UUID,
    body: BoardUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Board:
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Quadro nao encontrado.")

    if body.name is not None:
        board.name = body.name.strip()
    if body.description is not None:
        board.description = body.description
    if body.is_active is not None:
        board.is_active = body.is_active

    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Quadro nao encontrado.")
    board.is_active = False
    db.add(board)
    await db.commit()


# ============================================================
# COLUMNS
# ============================================================

@router.post("/{board_id}/columns", response_model=BoardColumnRead, status_code=status.HTTP_201_CREATED)
async def create_column(
    board_id: uuid.UUID,
    body: BoardColumnCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardColumn:
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Quadro nao encontrado.")

    max_position_result = await db.execute(
        select(func.coalesce(func.max(BoardColumn.position), -1)).where(BoardColumn.board_id == board_id)
    )
    next_position = max_position_result.scalar() + 1

    column = BoardColumn(
        board_id=board_id,
        name=body.name.strip(),
        color=body.color,
        position=next_position,
        is_done_column=body.is_done_column,
    )
    db.add(column)
    await db.commit()
    await db.refresh(column)
    return column


@router.patch("/columns/{column_id}", response_model=BoardColumnRead)
async def update_column(
    column_id: uuid.UUID,
    body: BoardColumnUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardColumn:
    column = await db.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Coluna nao encontrada.")

    if body.name is not None:
        column.name = body.name.strip()
    if body.color is not None:
        column.color = body.color
    if body.is_done_column is not None:
        column.is_done_column = body.is_done_column

    db.add(column)
    await db.commit()
    await db.refresh(column)
    return column


@router.post("/{board_id}/columns/reorder", response_model=list[BoardColumnRead])
async def reorder_columns(
    board_id: uuid.UUID,
    body: BoardColumnReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BoardColumn]:
    result = await db.execute(select(BoardColumn).where(BoardColumn.board_id == board_id))
    columns_by_id = {c.id: c for c in result.scalars().all()}

    for item in body.columns:
        column = columns_by_id.get(item.id)
        if column:
            column.position = item.position
            db.add(column)

    await db.commit()

    final_result = await db.execute(
        select(BoardColumn).where(BoardColumn.board_id == board_id).order_by(BoardColumn.position)
    )
    return list(final_result.scalars().all())


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    column = await db.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Coluna nao encontrada.")

    task_count_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.column_id == column_id)
    )
    if task_count_result.scalar() > 0:
        raise HTTPException(
            status_code=409, detail="Mova ou remova as tarefas desta coluna antes de exclui-la."
        )

    await db.delete(column)
    await db.commit()


# ============================================================
# TASKS
# ============================================================

@router.post("/{board_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    board_id: uuid.UUID,
    body: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    board = await db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Quadro nao encontrado.")

    column = await db.get(BoardColumn, body.column_id)
    if not column or column.board_id != board_id:
        raise HTTPException(status_code=404, detail="Coluna nao encontrada neste quadro.")

    max_position_result = await db.execute(
        select(func.coalesce(func.max(Task.position), -1)).where(Task.column_id == body.column_id)
    )
    next_position = max_position_result.scalar() + 1

    task = Task(
        board_id=board_id,
        column_id=body.column_id,
        title=body.title.strip(),
        description=body.description,
        priority=body.priority,
        position=next_position,
        due_at=body.due_at,
        custom_fields=body.custom_fields,
    )
    db.add(task)
    await db.flush()

    for user_id in body.assignee_ids:
        db.add(TaskAssignee(task_id=task.id, user_id=user_id))

    await db.commit()

    result = await db.execute(
        select(Task)
        .where(Task.id == task.id)
        .options(selectinload(Task.assignees).selectinload(TaskAssignee.user))
    )
    return result.scalar_one()


@router.get("/{board_id}/tasks", response_model=list[TaskRead])
async def list_tasks(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.board_id == board_id)
        .options(selectinload(Task.assignees).selectinload(TaskAssignee.user))
        .order_by(Task.position)
    )
    return list(result.scalars().all())


@router.patch("/tasks/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada.")

    if body.title is not None:
        task.title = body.title.strip()
    if body.description is not None:
        task.description = body.description
    if body.priority is not None:
        task.priority = body.priority
    if body.due_at is not None:
        task.due_at = body.due_at
    if body.custom_fields is not None:
        task.custom_fields = body.custom_fields

    db.add(task)
    await db.commit()

    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.assignees).selectinload(TaskAssignee.user))
    )
    return result.scalar_one()


@router.post("/tasks/{task_id}/move", response_model=TaskRead)
async def move_task(
    task_id: uuid.UUID,
    body: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    """Move uma task para outra coluna e/ou posicao (drag-and-drop)."""
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada.")

    target_column = await db.get(BoardColumn, body.column_id)
    if not target_column or target_column.board_id != task.board_id:
        raise HTTPException(status_code=404, detail="Coluna de destino invalida.")

    old_column_id = task.column_id

    if old_column_id != body.column_id:
        origin_tasks_result = await db.execute(
            select(Task).where(Task.column_id == old_column_id, Task.id != task_id).order_by(Task.position)
        )
        for idx, t in enumerate(origin_tasks_result.scalars().all()):
            t.position = idx
            db.add(t)

    dest_tasks_result = await db.execute(
        select(Task).where(Task.column_id == body.column_id, Task.id != task_id).order_by(Task.position)
    )
    dest_tasks = list(dest_tasks_result.scalars().all())
    dest_tasks.insert(min(body.position, len(dest_tasks)), task)

    for idx, t in enumerate(dest_tasks):
        t.position = idx
        t.column_id = body.column_id
        db.add(t)

    if target_column.is_done_column and not task.completed_at:
        from datetime import datetime, timezone
        task.completed_at = datetime.now(timezone.utc)
    elif not target_column.is_done_column:
        task.completed_at = None

    await db.commit()

    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.assignees).selectinload(TaskAssignee.user))
    )
    return result.scalar_one()


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada.")
    await db.delete(task)
    await db.commit()


@router.put("/tasks/{task_id}/assignees", response_model=TaskRead)
async def set_task_assignees(
    task_id: uuid.UUID,
    body: TaskAssigneesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Task:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada.")

    existing_result = await db.execute(select(TaskAssignee).where(TaskAssignee.task_id == task_id))
    for existing in existing_result.scalars().all():
        await db.delete(existing)
    await db.flush()

    for user_id in body.assignee_ids:
        db.add(TaskAssignee(task_id=task_id, user_id=user_id))

    await db.commit()

    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.assignees).selectinload(TaskAssignee.user))
    )
    return result.scalar_one()


# ============================================================
# COMMENTS
# ============================================================

@router.post("/tasks/{task_id}/comments", response_model=TaskCommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: uuid.UUID,
    body: TaskCommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada.")

    comment = TaskComment(task_id=task_id, author_id=current_user.id, body=body.body.strip())
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return {
        "id": comment.id,
        "task_id": comment.task_id,
        "author_id": comment.author_id,
        "author_name": current_user.name,
        "body": comment.body,
        "created_at": comment.created_at,
    }


@router.get("/tasks/{task_id}/comments", response_model=list[TaskCommentRead])
async def list_comments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(TaskComment)
        .where(TaskComment.task_id == task_id)
        .options(selectinload(TaskComment.author))
        .order_by(TaskComment.created_at)
    )
    comments = result.scalars().all()
    return [
        {
            "id": c.id,
            "task_id": c.task_id,
            "author_id": c.author_id,
            "author_name": c.author.name,
            "body": c.body,
            "created_at": c.created_at,
        }
        for c in comments
    ]