from datetime import datetime, timezone
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    service: str = Field(default="polaris-ai", description="Name of the service")
    status: str = Field(default="healthy", description="Operational status")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp"
    )
    version: str = Field(default="0.1.0", description="Semantic service version")
