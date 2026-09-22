from datetime import datetime
from zoneinfo import ZoneInfo

LOCAL_TZ = ZoneInfo("Africa/Addis_Ababa")

def get_local_now() -> datetime:
    return datetime.now(LOCAL_TZ)

def get_utc_now() -> datetime:
    from datetime import timezone
    return datetime.now(timezone.utc)
