import datetime

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User

from psycopg2.errors import UniqueViolation


class AlreadyRebloomedError(Exception):
    pass


@dataclass
class Bloom:
    id: int
    sender: User
    content: str
    sent_timestamp: datetime.datetime
    original_bloom_id: Optional[int] = None
    original_sender: Optional[str] = None
    original_sent_timestamp: Optional[datetime.datetime] = None
    rebloom_count: int = 0
    rebloomed_by_current_user: bool = False


# Shared by every read query below: resolves original-bloom attribution and
# rebloom stats via the self-referencing original_bloom_id column, rather than
# a separate table or a stored counter.
_SELECT_FIELDS = """
              b.id, u.username, b.content, b.send_timestamp,
              b.original_bloom_id, orig_user.username, orig.send_timestamp,
              (
                SELECT COUNT(*) FROM blooms rb
                WHERE rb.original_bloom_id = COALESCE(b.original_bloom_id, b.id)
              ),
              EXISTS(
                SELECT 1 FROM blooms rb2
                WHERE rb2.sender_id = %(current_user_id)s
                  AND rb2.original_bloom_id = COALESCE(b.original_bloom_id, b.id)
              )
"""

_JOIN_CLAUSE = """
              blooms b
              INNER JOIN users u ON u.id = b.sender_id
              LEFT JOIN blooms orig ON orig.id = b.original_bloom_id
              LEFT JOIN users orig_user ON orig_user.id = orig.sender_id
"""


def _bloom_from_row(row) -> Bloom:
    (
        bloom_id,
        sender_username,
        content,
        timestamp,
        original_bloom_id,
        original_sender,
        original_sent_timestamp,
        rebloom_count,
        rebloomed_by_current_user,
    ) = row
    return Bloom(
        id=bloom_id,
        sender=sender_username,
        content=content,
        sent_timestamp=timestamp,
        original_bloom_id=original_bloom_id,
        original_sender=original_sender,
        original_sent_timestamp=original_sent_timestamp,
        rebloom_count=rebloom_count,
        rebloomed_by_current_user=rebloomed_by_current_user,
    )


def add_bloom(
    *, sender_id: int, content: str, original_bloom_id: Optional[int] = None
) -> int:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp, original_bloom_id) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s, %(original_bloom_id)s)",
            dict(
                bloom_id=bloom_id,
                sender_id=sender_id,
                content=content,
                timestamp=now,
                original_bloom_id=original_bloom_id,
            ),
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                dict(hashtag=hashtag, bloom_id=bloom_id),
            )
    return bloom_id


def add_rebloom(*, sender_id: int, original_bloom_id: int, content: str) -> int:
    try:
        return add_bloom(
            sender_id=sender_id,
            content=content,
            original_bloom_id=original_bloom_id,
        )
    except UniqueViolation:
        raise AlreadyRebloomedError(
            f"User {sender_id} has already reblооmed bloom {original_bloom_id}"
        )


def get_blooms_for_user(
    username: str,
    *,
    current_user_id: Optional[int] = None,
    before: Optional[int] = None,
    limit: Optional[int] = None,
) -> List[Bloom]:
    with db_cursor() as cur:
        kwargs = {
            "sender_username": username,
            "current_user_id": current_user_id,
        }
        if before is not None:
            before_clause = "AND b.send_timestamp < %(before_limit)s"
            kwargs["before_limit"] = before
        else:
            before_clause = ""

        limit_clause = make_limit_clause(limit, kwargs)

        cur.execute(
            f"""SELECT
              {_SELECT_FIELDS}
            FROM
              {_JOIN_CLAUSE}
            WHERE
              u.username = %(sender_username)s
              {before_clause}
            ORDER BY b.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        return [_bloom_from_row(row) for row in rows]


def get_bloom(
    bloom_id: int, *, current_user_id: Optional[int] = None
) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              {_SELECT_FIELDS}
            FROM
              {_JOIN_CLAUSE}
            WHERE
              b.id = %(bloom_id)s
            """,
            {"bloom_id": bloom_id, "current_user_id": current_user_id},
        )
        row = cur.fetchone()
        if row is None:
            return None
        return _bloom_from_row(row)


def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str,
    *,
    current_user_id: Optional[int] = None,
    limit: int = None,
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
        "current_user_id": current_user_id,
    }
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              {_SELECT_FIELDS}
            FROM
              {_JOIN_CLAUSE}
              INNER JOIN hashtags ON b.id = hashtags.bloom_id
            WHERE
              hashtag = %(hashtag_without_leading_hash)s
            ORDER BY b.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        return [_bloom_from_row(row) for row in rows]


def make_limit_clause(limit: Optional[int], kwargs: Dict[Any, Any]) -> str:
    if limit is not None:
        limit_clause = "LIMIT %(limit)s"
        kwargs["limit"] = limit
    else:
        limit_clause = ""
    return limit_clause
