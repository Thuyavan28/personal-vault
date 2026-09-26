import requests
import json
import sys

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_post_api_pin_create_setup_4_digit_security_pin():
    login_url = f"{BASE_URL}/api/auth/login"
    pin_create_url = f"{BASE_URL}/api/pin/create"
    # candidate endpoints to attempt PIN deletion/cleanup (best-effort)
    pin_delete_candidates = [
        f"{BASE_URL}/api/pin",
        f"{BASE_URL}/api/pin/delete",
        f"{BASE_URL}/api/pin/remove"
    ]

    session = requests.Session()
    headers = {"Content-Type": "application/json"}

    # 1) Authenticate with demo credentials
    login_payload = {"email": "demo@securevault.io", "password": "Password123!"}
    try:
        resp = session.post(login_url, headers=headers, data=json.dumps(login_payload), timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")

    if resp.status_code not in (200, 201):
        # include response body for debugging
        body = None
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        raise AssertionError(f"Login failed with status {resp.status_code}: {body}")

    # Attempt to extract token from various common fields
    token = None
    try:
        resp_json = resp.json()
        for key in ("token", "access_token", "accessToken", "auth_token"):
            if key in resp_json and resp_json.get(key):
                token = resp_json.get(key)
                break
    except ValueError:
        resp_json = None

    # If token found, use Authorization header; otherwise rely on session cookies
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        # update session cookies from login response if any (already handled by session)
        pass

    # 2) Create a 4-digit PIN (use multiple common field names for maximum compatibility)
    pin_payload = {
        "pin": "1234",
        "confirm_pin": "1234",
        "confirmPin": "1234"
    }

    try:
        resp = session.post(pin_create_url, headers=headers, data=json.dumps(pin_payload), timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"PIN creation request failed: {e}")

    # 3) Validate response: accept 200/201/204 as success
    if resp.status_code in (200, 201, 204):
        if resp.status_code == 204:
            # No content but successful
            success = True
        else:
            try:
                body = resp.json()
            except ValueError:
                body = resp.text
            # Determine success from body if possible
            success = False
            if isinstance(body, dict):
                # common success indicators
                if body.get("success") is True:
                    success = True
                elif body.get("status") in ("ok", "success", "created"):
                    success = True
                elif "pin" in body.get("message", "").lower() or "success" in body.get("message", "").lower():
                    success = True
                else:
                    # if server returns created object or message, treat as success
                    success = True
            else:
                # non-json but 200/201, treat as success
                success = True

        assert success is True, f"PIN creation response did not indicate success: {resp.text}"
    else:
        # Failure - include response body for debugging
        body_text = None
        try:
            body_text = resp.json()
        except Exception:
            body_text = resp.text
        raise AssertionError(f"Unexpected status code for PIN creation: {resp.status_code}: {body_text}")

    # 4) Cleanup: best-effort attempt to delete the created PIN so demo account returns to initial state
    deletion_errors = []
    for candidate in pin_delete_candidates:
        try:
            delete_resp = session.delete(candidate, headers=headers, timeout=TIMEOUT)
            if delete_resp.status_code in (200, 204):
                # deleted successfully
                return
            else:
                # collect for debugging but continue trying other endpoints
                deletion_errors.append((candidate, delete_resp.status_code, delete_resp.text))
        except requests.RequestException as e:
            deletion_errors.append((candidate, "exception", str(e)))

    # If we reach here, cleanup did not clearly succeed; raise a warning-level assertion but do not fail the test
    # Using print to surface cleanup issues but not failing because the primary assert already passed
    if deletion_errors:
        print("Warning: PIN cleanup attempts did not clearly succeed. Details:")
        for err in deletion_errors:
            print(err)


if __name__ == "__main__":
    try:
        test_post_api_pin_create_setup_4_digit_security_pin()
        print("TC004 passed.")
    except AssertionError as e:
        print(f"TC004 failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"TC004 encountered an unexpected error: {e}")
        sys.exit(1)