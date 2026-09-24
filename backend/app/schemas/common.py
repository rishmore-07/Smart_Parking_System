from typing import Generic, Optional, TypeVar, Any
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    environment: str
    database: str = "connected"
