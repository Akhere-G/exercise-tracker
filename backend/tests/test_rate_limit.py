import pytest
from app import rate_limit
from app.models import User
from app.rate_limit import SlidingWindowCounter, client_ip
from app.services import user as user_service

PASSWORD = "Password1"


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


# the counter ----------------------------------------------------------------

def test_counter_limits_then_recovers_as_the_window_slides():
    clock = FakeClock()
    counter = SlidingWindowCounter(limit=2, window_secs=10, clock=clock)

    counter.record("k")
    clock.now += 4
    counter.record("k")
    assert counter.is_limited("k")
    assert counter.retry_after("k") == 6

    clock.now += 6  # the first event has now left the window
    assert not counter.is_limited("k")


def test_counter_keys_are_independent_and_resettable():
    counter = SlidingWindowCounter(limit=1, window_secs=10, clock=FakeClock())

    counter.record("a")

    assert counter.is_limited("a")
    assert not counter.is_limited("b")
    counter.reset("a")
    assert not counter.is_limited("a")


def test_counter_does_not_grow_without_bound(monkeypatch):
    monkeypatch.setattr(rate_limit, "_MAX_TRACKED_KEYS", 5)
    counter = SlidingWindowCounter(limit=1, window_secs=10, clock=FakeClock())

    for i in range(50):
        counter.record(f"key{i}")

    assert len(counter._events) <= 5


# client ip ------------------------------------------------------------------

class _Request:
    def __init__(self, forwarded=None, host="10.0.0.1"):
        self.headers = {"x-forwarded-for": forwarded} if forwarded else {}
        self.client = type("Client", (), {"host": host})()


def test_client_ip_uses_the_entry_added_by_our_proxy(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")

    assert client_ip(_Request("1.1.1.1, 2.2.2.2")) == "2.2.2.2"  # left entry is spoofable


def test_client_ip_falls_back_to_the_socket_address(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")
    assert client_ip(_Request(None)) == "10.0.0.1"

    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "0")
    assert client_ip(_Request("9.9.9.9")) == "10.0.0.1"

    monkeypatch.delenv("TRUSTED_PROXY_COUNT")
    assert client_ip(_Request("9.9.9.9")) == "10.0.0.1"


# endpoints ------------------------------------------------------------------

@pytest.fixture(autouse=True)
def behind_one_proxy(monkeypatch):
    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")


@pytest.fixture
def account(db):
    db.add(
        User(
            username="Rate",
            email="rate@example.com",
            password_hash=user_service.get_password_hash(PASSWORD),
        )
    )
    db.commit()


def _login(client, password="Wrong-password1", email="rate@example.com", ip="5.5.5.5"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
        headers={"X-Forwarded-For": ip},
    )


def test_sixth_failed_login_is_throttled(client, account):
    assert [_login(client).status_code for _ in range(5)] == [401] * 5

    blocked = _login(client)

    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) >= 1
    # Even the right password is refused during the lockout.
    assert _login(client, password=PASSWORD).status_code == 429


def test_lockout_is_per_ip_and_email(client, account):
    for _ in range(5):
        _login(client)

    assert _login(client, ip="6.6.6.6", password=PASSWORD).status_code == 200
    assert _login(client, email="other@example.com").status_code == 401


def test_spoofing_the_left_forwarded_for_entry_does_not_dodge_the_limit(client, account):
    for i in range(5):
        _login(client, ip=f"{i}.{i}.{i}.{i}, 5.5.5.5")

    assert _login(client, ip="7.7.7.7, 5.5.5.5").status_code == 429


def test_one_ip_spraying_many_emails_is_throttled(client, account):
    codes = [_login(client, email=f"user{i}@example.com").status_code for i in range(21)]

    assert codes[:20] == [401] * 20
    assert codes[20] == 429


def test_successful_login_clears_the_failure_count(client, account):
    for _ in range(4):
        _login(client)
    assert _login(client, password=PASSWORD).status_code == 200

    assert [_login(client).status_code for _ in range(5)] == [401] * 5


def test_token_endpoint_shares_the_login_limits(client, account):
    for _ in range(5):
        _login(client)

    response = client.post(
        "/api/auth/token",
        data={"username": "rate@example.com", "password": PASSWORD},
        headers={"X-Forwarded-For": "5.5.5.5"},
    )

    assert response.status_code == 429


def test_register_is_limited_per_ip(client):
    def register(n):
        return client.post(
            "/api/auth/register",
            json={"username": "U", "email": f"u{n}@example.com", "password": PASSWORD},
            headers={"X-Forwarded-For": "8.8.8.8"},
        )

    assert [register(n).status_code for n in range(5)] == [201] * 5
    assert register(5).status_code == 429


def test_demo_login_is_limited_per_ip(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE_ENABLED", "true")
    codes = [
        client.post("/api/auth/demo", headers={"X-Forwarded-For": "4.4.4.4"}).status_code
        for _ in range(31)
    ]

    assert 429 not in codes[:30]
    assert codes[30] == 429


# without TRUSTED_PROXY_COUNT --------------------------------------------------

def test_ip_only_limits_are_off_when_the_proxy_setup_is_unknown(client, monkeypatch):
    """Behind the Next.js server every user shares one IP, so these would hit everyone."""
    monkeypatch.delenv("TRUSTED_PROXY_COUNT")

    def register(n):
        return client.post(
            "/api/auth/register",
            json={"username": "U", "email": f"u{n}@example.com", "password": PASSWORD},
        )

    assert [register(n).status_code for n in range(8)] == [201] * 8


def test_per_account_lockout_still_applies_without_proxy_config(client, account, monkeypatch):
    monkeypatch.delenv("TRUSTED_PROXY_COUNT")

    for _ in range(5):
        _login(client)

    assert _login(client, password=PASSWORD).status_code == 429
    # ...but other accounts are unaffected, and so is the IP overall.
    assert _login(client, email="other@example.com").status_code == 401
