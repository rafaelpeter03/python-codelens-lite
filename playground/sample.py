"""Playground file to validate Python CodeLens Lite.

Covers every CodeLens target:
- classes (targets.classes)
- methods (targets.methods)
- functions (targets.functions)
- module variables (targets.moduleVariables)
- inheritance / implementations (lenses.showImplementations)
- stdlib imports (targets.imports.stdlib)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum

# --- Module variables (targets.moduleVariables) ---------------------------

DEFAULT_TIMEOUT = 30
MAX_RETRIES = 3
UNUSED_CONSTANT = "should show 0 references"


# --- Enums (classes + references on members) -------------------------------

class Status(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class Priority(StrEnum):
    LOW = "low"
    HIGH = "high"


# --- Base class with implementations (lenses.showImplementations) ----------

class BaseRepository(ABC):
    """Abstract base: should show an 'implementations' lens."""

    @abstractmethod
    def save(self, item: dict) -> None: ...

    @abstractmethod
    def find_by_id(self, item_id: int) -> dict | None: ...


class MemoryRepository(BaseRepository):
    """Concrete implementation #1."""

    def __init__(self) -> None:
        self._items: dict[int, dict] = {}

    def save(self, item: dict) -> None:
        self._items[item["id"]] = item

    def find_by_id(self, item_id: int) -> dict | None:
        return self._items.get(item_id)


class FileRepository(BaseRepository):
    """Concrete implementation #2."""

    def save(self, item: dict) -> None:
        print(f"saving {item} to file")

    def find_by_id(self, item_id: int) -> dict | None:
        print(f"reading {item_id} from file")
        return None


# --- Regular classes and methods (targets.classes / targets.methods) -------

@dataclass
class User:
    name: str
    status: Status = Status.PENDING

    def activate(self) -> None:
        self.status = Status.ACTIVE

    def deactivate(self) -> None:
        self.status = Status.INACTIVE

    def unused_method(self) -> None:
        """Should show 0 references (tests references.showZero)."""


class UserService:
    def __init__(self, repository: BaseRepository) -> None:
        self.repository = repository

    def register(self, name: str) -> User:
        user = User(name=name)
        user.activate()
        self.repository.save({"id": 1, "name": user.name})
        return user

    def fetch(self, user_id: int) -> dict | None:
        return self.repository.find_by_id(user_id)


# --- Functions (targets.functions) ------------------------------------------

def create_service() -> UserService:
    repository = MemoryRepository()
    return UserService(repository)


def process_users() -> None:
    service = create_service()
    user = service.register("Alice")
    print(user.status, service.fetch(1))


def retry_with_timeout() -> None:
    """References module variables (DEFAULT_TIMEOUT, MAX_RETRIES)."""
    for attempt in range(MAX_RETRIES):
        print(f"attempt {attempt} with timeout {DEFAULT_TIMEOUT}s")


def unused_function() -> None:
    """Should show 0 references."""


def handle_priority(priority: Priority) -> str:
    if priority is Priority.HIGH:
        return "urgent"
    return "normal"


# --- Usage (counts as references, not definitions/imports) -----------------

if __name__ == "__main__":
    process_users()
    retry_with_timeout()
    print(handle_priority(Priority.LOW))
