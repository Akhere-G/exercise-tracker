import pytest

KEYS = {"p256dh": "p", "auth": "a"}


@pytest.mark.parametrize(
    "endpoint",
    [
        "https://fcm.googleapis.com/fcm/send/abc",
        "https://updates.push.services.mozilla.com/wpush/v2/abc",
        "https://web.push.apple.com/abc",
        "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ],
)
def test_a_browser_push_endpoint_is_accepted(client, auth_headers, endpoint):
    response = client.post(
        "/api/notifications/subscribe",
        json={"endpoint": endpoint, "keys": KEYS},
        headers=auth_headers,
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    "endpoint",
    [
        "http://169.254.169.254/latest/meta-data",
        "https://169.254.169.254/latest",
        "http://fcm.googleapis.com/fcm/send/abc",
        "https://fcm.googleapis.com.evil.example/send",
        "https://evilfcm.googleapis.com@127.0.0.1/",
        "https://fcm.googleapis.com:8443/fcm/send/abc",
        "not a url",
    ],
)
def test_an_endpoint_that_is_not_a_push_service_is_refused(
    client, auth_headers, endpoint
):
    response = client.post(
        "/api/notifications/subscribe",
        json={"endpoint": endpoint, "keys": KEYS},
        headers=auth_headers,
    )

    assert response.status_code == 422
