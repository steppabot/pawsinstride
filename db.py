import atexit
import contextlib
import os
import signal
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

_dbpool: ThreadedConnectionPool | None = None


def _get_pool() -> ThreadedConnectionPool:
    global _dbpool
    if _dbpool is None:
        _dbpool = ThreadedConnectionPool(
            1,
            10,
            dsn=DATABASE_URL,
            sslmode="require",
            options="-c timezone=UTC",
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5,
        )
    return _dbpool


@contextlib.contextmanager
def get_safe_cursor(retries: int = 1, dict_cursor: bool = False):
    global _dbpool

    attempt = 0
    last_exc = None

    while True:
        pool = _get_pool()
        conn = None

        try:
            conn = pool.getconn()

            try:
                with conn.cursor() as ping:
                    ping.execute("SELECT 1")
            except (psycopg2.InterfaceError, psycopg2.OperationalError):
                pool.putconn(conn, close=True)
                conn = None
                raise

            cursor_factory = RealDictCursor if dict_cursor else None
            cur = conn.cursor(cursor_factory=cursor_factory)

            try:
                yield cur
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                try:
                    cur.close()
                except Exception:
                    pass

            break

        except psycopg2.OperationalError as e:
            last_exc = e
            attempt += 1

            if _dbpool is not None:
                try:
                    _dbpool.closeall()
                except Exception:
                    pass
                _dbpool = None

            if attempt > retries:
                raise last_exc

        finally:
            if conn is not None and not conn.closed and _dbpool is not None:
                try:
                    _dbpool.putconn(conn)
                except Exception:
                    try:
                        conn.close()
                    except Exception:
                        pass


def close_db_pool():
    global _dbpool
    if _dbpool is not None:
        _dbpool.closeall()
        _dbpool = None


atexit.register(close_db_pool)


def _graceful_exit(*_):
    close_db_pool()


for sig in (getattr(signal, "SIGINT", None), getattr(signal, "SIGTERM", None)):
    if sig is not None:
        signal.signal(sig, _graceful_exit)


def init_db():
    with psycopg2.connect(DATABASE_URL, sslmode="require", options="-c timezone=UTC") as conn:
        conn.autocommit = True

        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = 30000")

            cur.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                delivery_address TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                zipcode TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS dogs (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                dog_name TEXT NOT NULL,
                breed TEXT,
                age_years INTEGER,
                weight_range TEXT NOT NULL,
                activity_level TEXT NOT NULL,
                allergies TEXT[] NOT NULL DEFAULT '{}',
                recommended_plan TEXT NOT NULL,
                daily_ounces INTEGER NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                stripe_checkout_session_id TEXT,
                subscription_status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """)


# -----------------------------
# Customer / Dog creation
# -----------------------------

def create_customer(first_name, last_name, email, phone, address, city, state, zipcode):
    with get_safe_cursor() as cur:
        cur.execute("""
            INSERT INTO customers (
                first_name, last_name, email, phone,
                delivery_address, city, state, zipcode
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (first_name, last_name, email, phone, address, city, state, zipcode))
        return cur.fetchone()[0]


def create_dog(customer_id, dog_name, breed, age_years, weight_range, activity_level, allergies, recommended_plan, daily_ounces):
    with get_safe_cursor() as cur:
        cur.execute("""
            INSERT INTO dogs (
                customer_id, dog_name, breed, age_years,
                weight_range, activity_level, allergies,
                recommended_plan, daily_ounces
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            customer_id, dog_name, breed, age_years,
            weight_range, activity_level, allergies,
            recommended_plan, daily_ounces
        ))
        return cur.fetchone()[0]


def recommend_plan(weight_range: str) -> tuple[str, int]:
    mapping = {
        "0-20 lbs": ("Small Plan", 8),
        "21-40 lbs": ("Medium Plan", 14),
        "41-70 lbs": ("Large Plan", 20),
        "71+ lbs": ("XL Plan", 22),
    }
    return mapping[weight_range]


# -----------------------------
# Subscription helpers
# -----------------------------

def create_subscription(
    customer_id,
    dog_id,
    stripe_customer_id=None,
    stripe_subscription_id=None,
    stripe_checkout_session_id=None,
    subscription_status="pending",
):
    with get_safe_cursor() as cur:
        cur.execute("""
            INSERT INTO subscriptions (
                customer_id,
                dog_id,
                stripe_customer_id,
                stripe_subscription_id,
                stripe_checkout_session_id,
                subscription_status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            customer_id,
            dog_id,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_checkout_session_id,
            subscription_status
        ))
        return cur.fetchone()[0]


def update_subscription_status_by_subscription_id(stripe_subscription_id, subscription_status):
    with get_safe_cursor() as cur:
        cur.execute("""
            UPDATE subscriptions
            SET subscription_status = %s
            WHERE stripe_subscription_id = %s
        """, (subscription_status, stripe_subscription_id))


def update_subscription_status_by_customer(
    stripe_customer_id,
    subscription_status,
    stripe_subscription_id=None
):
    with get_safe_cursor() as cur:
        cur.execute("""
            UPDATE subscriptions
            SET
                subscription_status = %s,
                stripe_subscription_id = COALESCE(%s, stripe_subscription_id),
                stripe_customer_id = COALESCE(%s, stripe_customer_id)
            WHERE stripe_customer_id = %s
        """, (
            subscription_status,
            stripe_subscription_id,
            stripe_customer_id,
            stripe_customer_id
        ))


def update_subscription_ids_by_customer(
    email,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_checkout_session_id,
    subscription_status="active",
):
    with get_safe_cursor() as cur:
        cur.execute("""
            UPDATE subscriptions s
            SET
                stripe_customer_id = %s,
                stripe_subscription_id = %s,
                stripe_checkout_session_id = %s,
                subscription_status = %s
            FROM customers c
            WHERE s.customer_id = c.id
              AND LOWER(c.email) = LOWER(%s)
              AND s.subscription_status = 'pending'
        """, (
            stripe_customer_id,
            stripe_subscription_id,
            stripe_checkout_session_id,
            subscription_status,
            email
        ))