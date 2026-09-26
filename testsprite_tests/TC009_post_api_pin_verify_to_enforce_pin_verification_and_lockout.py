import requests
import time
import sys

BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PIN_VERIFY_URL = f"{BASE_URL}/api/pin/verify"
DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
CORRECT_PIN = "1234"
WRONG_PIN = "0000"
REQUEST_TIMEOUT = 30


def extract_token(json_obj):
    if not isinstance(json_obj, dict):
        return None
    # common token keys
    for key in ("token", "access_token", "accessToken", "jwt", "auth_token"):
        if key in json_obj and isinstance(json_obj[key], str):
            return json_obj[key]
    # nested search
    for key in ("data", "result", "user"):
        if key in json_obj and isinstance(json_obj[key], dict):
            for tkey in ("token", "access_token", "accessToken", "jwt", "auth_token"):
                if tkey in json_obj[key] and isinstance(json_obj[key][tkey], str):
                    return json_obj[key][tkey]
    return None


def is_lockout_response(resp):
    # Acceptable lockout status codes or body messages
    try:
        text = ""
        j = None
        try:
            j = resp.json()
            # join all string values for search
            def collect_strings(obj):
                result = []
                if isinstance(obj, dict):
                    for v in obj.values():
                        result.extend(collect_strings(v))
                elif isinstance(obj, list):
                    for v in obj:
                        result.extend(collect_strings(v))
                elif isinstance(obj, str):
                    result.append(obj)
                return result
            text = " ".join(collect_strings(j)).lower()
        except ValueError:
            text = resp.text.lower() if resp.text else ""

        if resp.status_code in (423, 429):  # Locked or Too Many Requests
            return True
        # Common message indicators
        for kw in ("locked", "lockout", "too many attempts", "temporar", "try again in", "wait", "seconds"):
            if kw in text:
                return True
        return False
    except Exception:
        return False


def test_pin_verify_lockout():
    # Authenticate
    try:
        r = requests.post(
            LOGIN_URL,
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
            timeout=REQUEST_TIMEOUT,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    assert r.status_code in (200, 201), f"Login failed, unexpected status code: {r.status_code}, body: {r.text}"
    try:
        token = extract_token(r.json())
    except Exception:
        token = None
    assert token, f"Failed to extract auth token from login response: {r.text}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Perform 5 consecutive failed PIN attempts
    lockout_triggered = False
    for attempt in range(1, 6):
        try:
            resp = requests.post(
                PIN_VERIFY_URL,
                json={"pin": WRONG_PIN},
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )
        except Exception as e:
            raise AssertionError(f"PIN verify request failed on attempt {attempt}: {e}")

        # For attempts 1-4 expect simple failure (not 200). On 5th expect lockout indicator.
        if attempt < 5:
            assert resp.status_code != 200, (
                f"Attempt {attempt}: expected failure for wrong PIN but got 200 OK. Body: {resp.text}"
            )
        else:
            # 5th attempt should trigger lockout / indicate lockout
            if not is_lockout_response(resp):
                raise AssertionError(
                    f"5th failed attempt did not result in lockout. Status: {resp.status_code}, Body: {resp.text}"
                )
            lockout_triggered = True

    assert lockout_triggered, "Lockout was not triggered after 5 consecutive failed attempts"

    # Immediately attempt correct PIN during lockout - should be rejected / indicate lockout
    try:
        resp_during_lock = requests.post(
            PIN_VERIFY_URL,
            json={"pin": CORRECT_PIN},
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
    except Exception as e:
        raise AssertionError(f"PIN verify request during lockout failed: {e}")

    assert is_lockout_response(resp_during_lock), (
        f"Correct PIN attempt during lockout should be rejected. Status: {resp_during_lock.status_code}, Body: {resp_during_lock.text}"
    )

    # Wait for 31 seconds (lockout is 30 seconds) then attempt correct PIN - should succeed
    time.sleep(31)

    try:
        resp_after_wait = requests.post(
            PIN_VERIFY_URL,
            json={"pin": CORRECT_PIN},
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
    except Exception as e:
        raise AssertionError(f"PIN verify request after waiting failed: {e}")

    assert resp_after_wait.status_code in (200, 201), (
        f"Correct PIN after lockout wait should succeed. Status: {resp_after_wait.status_code}, Body: {resp_after_wait.text}"
    )

    # Optionally check response body indicates success
    try:
        j = resp_after_wait.json()
        # success indicators
        ok = False
        if isinstance(j, dict):
            for key in ("success", "ok", "unlocked"):
                if key in j and (j[key] is True or str(j[key]).lower() == "true"):
                    ok = True
            # or presence of message indicating success
            for v in j.values():
                if isinstance(v, str) and ("success" in v.lower() or "unlocked" in v.lower()):
                    ok = True
        assert ok or resp_after_wait.status_code in (200, 201), (
            f"After wait the response did not explicitly indicate success. Body: {resp_after_wait.text}"
        )
    except ValueError:
        # non-json but got 200: accept as success
        pass

    print("TC009 passed: PIN lockout enforced for 5 failed attempts, blocked during lockout, and allowed after 30s.")


if __name__ == "__main__":
    try:
        test_pin_verify_lockout()
    except AssertionError as e:
        print(f"Test failed: {e}")
        sys.exit(1)
    except Exception as exc:
        print(f"Unexpected error: {exc}")
        sys.exit(2)
    sys.exit(0)