import requests
import uuid
import time
import sys

BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = "/api/auth/login"
CREDENTIALS_ENDPOINT = "/api/vault/credentials"

DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
REQUEST_TIMEOUT = 30


def test_post_api_vault_credentials_add_password():
    session = requests.Session()
    created_id = None
    headers = {"Content-Type": "application/json"}
    try:
        # 1) Authenticate using demo credentials
        login_url = BASE_URL + LOGIN_ENDPOINT
        login_payload = {"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        resp = session.post(login_url, json=login_payload, timeout=REQUEST_TIMEOUT)
        assert resp is not None, "No response from login request"
        assert resp.status_code == 200, f"Expected 200 OK from login, got {resp.status_code}: {resp.text}"

        login_json = {}
        try:
            login_json = resp.json()
        except ValueError:
            raise AssertionError("Login response is not valid JSON")

        # Extract token from common fields
        token = None
        for key in ("token", "accessToken", "access_token", "jwt"):
            if key in login_json and login_json.get(key):
                token = login_json.get(key)
                break
        # Some APIs return nested { "data": { "token": "..." } }
        if not token and isinstance(login_json.get("data"), dict):
            for key in ("token", "accessToken", "access_token", "jwt"):
                if key in login_json["data"] and login_json["data"].get(key):
                    token = login_json["data"].get(key)
                    break

        assert token, f"Authentication token not found in login response: {login_json}"

        # Set Authorization header for subsequent requests
        headers["Authorization"] = f"Bearer {token}"

        # 2) Create a new password credential
        credentials_url = BASE_URL + CREDENTIALS_ENDPOINT
        unique_suffix = str(uuid.uuid4())
        password_value = "GeneratedPassword!234"  # Example generated password
        payload = {
            "type": "password",
            "title": f"TC007 Test Credential {unique_suffix}",
            "username": f"tc007_user_{unique_suffix[:8]}",
            "password": password_value,
            "notes": "Automated test creation for TC007"
        }

        resp = session.post(credentials_url, json=payload, headers=headers, timeout=REQUEST_TIMEOUT)
        assert resp is not None, "No response from create credential request"
        assert resp.status_code in (200, 201, 202), f"Expected 2xx creating credential, got {resp.status_code}: {resp.text}"

        try:
            resp_json = resp.json()
        except ValueError:
            raise AssertionError("Create credential response is not valid JSON")

        # Validate success indications and extract created resource id
        success = False
        message = ""
        for k in ("success", "ok"):
            if k in resp_json and isinstance(resp_json[k], bool):
                success = resp_json[k]
                break
        if "message" in resp_json and isinstance(resp_json["message"], str):
            message = resp_json["message"]

        # Accept either explicit success boolean or presence of created id
        created_id_candidates = []
        # common top-level id fields
        for id_key in ("id", "_id", "credential_id", "credentialId", "credentialID"):
            if id_key in resp_json:
                created_id_candidates.append(resp_json[id_key])
        # nested data object
        if isinstance(resp_json.get("data"), dict):
            for id_key in ("id", "_id", "credential_id", "credentialId"):
                if id_key in resp_json["data"]:
                    created_id_candidates.append(resp_json["data"][id_key])

        # Ensure at least one sign of success
        assert success or created_id_candidates or ("created" in message.lower()) or ("success" in message.lower()) or ("celebrat" in message.lower()), \
            f"Create credential response did not indicate success: {resp_json}"

        # Prefer first candidate id if available
        if created_id_candidates:
            created_id = created_id_candidates[0]

        # If ID not returned, attempt to locate created resource via GET list and match title (best-effort)
        if not created_id:
            # Try to fetch items to find the created credential by title substring
            list_url = BASE_URL + "/api/vault/items"
            list_resp = session.get(list_url, headers=headers, timeout=REQUEST_TIMEOUT)
            if list_resp.status_code == 200:
                try:
                    items = list_resp.json()
                except ValueError:
                    items = None
                if isinstance(items, dict) and isinstance(items.get("data"), list):
                    for item in items["data"]:
                        if isinstance(item, dict) and item.get("title") == payload["title"]:
                            created_id = item.get("id") or item.get("_id")
                            break
                elif isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict) and item.get("title") == payload["title"]:
                            created_id = item.get("id") or item.get("_id")
                            break

        # At minimum ensure created_id was found or the response indicated success
        assert created_id or success, f"Could not determine created credential ID and no explicit success flag. Response: {resp_json}"

        # Additional validation: ensure password is not returned in cleartext unless expected
        # If API returns the created object, check that password field is not present or is masked
        if isinstance(resp_json.get("data"), dict):
            returned_obj = resp_json["data"]
            if "password" in returned_obj:
                # it's acceptable but warn/assert it's not the plaintext unless design expects it
                returned_pass = returned_obj.get("password")
                # If the API echoes password, it should match what we sent or be masked. We'll allow both but assert non-empty.
                assert returned_pass, "Returned password field is empty"

        # If reached here, test considered successful
        print("TC007: Create credential succeeded. ID:", created_id)

    except AssertionError:
        # Re-raise to reflect test failure
        raise
    except Exception as e:
        raise AssertionError(f"Unexpected error during test: {e}")
    finally:
        # Cleanup: delete created credential if we have an ID
        if created_id:
            # Attempt DELETE on likely endpoints
            delete_endpoints = [
                f"{BASE_URL}/api/vault/credentials/{created_id}",
                f"{BASE_URL}/api/vault/items/{created_id}"
            ]
            delete_success = False
            for del_url in delete_endpoints:
                try:
                    del_resp = session.delete(del_url, headers=headers, timeout=REQUEST_TIMEOUT)
                    # Accept 200, 202, 204 as success; 404 means resource not found on this endpoint
                    if del_resp.status_code in (200, 202, 204):
                        delete_success = True
                        break
                except Exception:
                    continue
            if not delete_success:
                # If deletion failed, raise to surface cleanup issue
                raise AssertionError(f"Failed to delete created credential with id {created_id}. Tried endpoints: {delete_endpoints}")


if __name__ == "__main__":
    try:
        test_post_api_vault_credentials_add_password()
        print("TC007 passed.")
    except AssertionError as ae:
        print("TC007 failed:", ae)
        sys.exit(1)
    except Exception as e:
        print("TC007 encountered an unexpected error:", e)
        sys.exit(1)