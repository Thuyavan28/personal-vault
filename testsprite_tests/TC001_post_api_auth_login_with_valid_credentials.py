import requests
import sys
import json

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_login_with_valid_credentials():
    url = f"{BASE_URL}/api/auth/login"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "email": "demo@securevault.io",
        "password": "Password123!"
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as err:
        raise AssertionError(f"HTTP request to {url} failed: {err}")

    # Basic status code check
    assert 200 <= resp.status_code < 300, f"Expected 2xx status code, got {resp.status_code}: {resp.text}"

    # Ensure response is JSON
    try:
        body = resp.json()
    except ValueError:
        raise AssertionError(f"Response is not valid JSON: {resp.text}")

    assert isinstance(body, dict), f"Expected JSON object in response, got: {type(body)}"

    # Check for common token/user keys in response
    possible_token_keys = {"token", "accessToken", "access_token", "jwt", "access_token_expires_at"}
    possible_user_keys = {"user", "email", "id", "profile"}

    found_token = any(k in body for k in possible_token_keys)
    found_user = any(k in body for k in possible_user_keys)

    # Also check nested under 'data'
    if not found_token or not found_user:
        data_field = body.get("data") if isinstance(body.get("data"), dict) else {}
        if isinstance(data_field, dict):
            if not found_token:
                found_token = any(k in data_field for k in possible_token_keys)
            if not found_user:
                found_user = any(k in data_field for k in possible_user_keys)

    assert found_token or found_user, f"Response JSON does not contain expected authentication tokens or user info: {json.dumps(body)}"

    print("TC001 passed: successful login returned expected authentication token or user info.")

if __name__ == "__main__":
    try:
        test_post_api_auth_login_with_valid_credentials()
    except AssertionError as e:
        print(f"TC001 failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"TC001 unexpected error: {e}")
        sys.exit(2)
    sys.exit(0)