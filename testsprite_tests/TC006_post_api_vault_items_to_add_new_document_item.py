import requests
import tempfile
import os
import json
from requests.exceptions import RequestException

BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = "/api/auth/login"
UPLOAD_ENDPOINT = "/api/vault/items"
DELETE_ENDPOINT_TEMPLATE = "/api/vault/items/{id}"

DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
TIMEOUT = 30  # seconds


def login_demo():
    """
    Attempt to log in with demo credentials.
    Returns a requests.Session and an auth token string (or None if not returned).
    """
    session = requests.Session()
    url = BASE_URL + LOGIN_ENDPOINT
    payload = {"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
    try:
        resp = session.post(url, json=payload, timeout=TIMEOUT)
    except RequestException as e:
        raise RuntimeError(f"Login request failed: {e}")
    if resp.status_code not in (200, 201):
        raise AssertionError(f"Login failed: {resp.status_code} {resp.text}")
    token = None
    try:
        data = resp.json()
        # Common token properties
        token = data.get("access_token") or data.get("token") or data.get("auth_token")
    except ValueError:
        # not JSON, continue using session cookies if present
        data = {}
    return session, token


def test_post_api_vault_items_add_document():
    session, token = login_demo()
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    created_id = None
    temp_file_path = None

    try:
        # Create a temporary file to upload
        fd, temp_file_path = tempfile.mkstemp(suffix=".txt")
        os.close(fd)
        with open(temp_file_path, "wb") as f:
            f.write(b"Test document content for SecureVault upload (TC006).")

        files = {
            "file": ("test_document.txt", open(temp_file_path, "rb"), "text/plain")
        }
        data = {
            "title": "TC006 Test Document",
            "category": "Documents",
            "description": "Automated test upload for TC006"
        }

        url = BASE_URL + UPLOAD_ENDPOINT
        try:
            resp = session.post(url, headers=headers, files=files, data=data, timeout=TIMEOUT)
        finally:
            # ensure file handle closed
            files["file"][1].close()

        if resp.status_code not in (200, 201, 202):
            raise AssertionError(f"Upload failed: {resp.status_code} {resp.text}")

        try:
            resp_json = resp.json()
        except ValueError:
            raise AssertionError(f"Upload response is not valid JSON: {resp.text}")

        # Validate that an ID was returned for the created item
        if "id" in resp_json:
            created_id = resp_json["id"]
        elif "_id" in resp_json:
            created_id = resp_json["_id"]
        else:
            raise AssertionError(f"Upload response missing created resource id: {json.dumps(resp_json)}")

        # Validate success/celebration indication if present
        message = ""
        for key in ("message", "msg", "status", "detail"):
            if key in resp_json:
                message = str(resp_json[key])
                break

        # It's acceptable if there's no explicit message; if present, assert it indicates success
        if message:
            lower = message.lower()
            assert ("success" in lower) or ("celebr" in lower) or ("created" in lower) or ("saved" in lower), \
                f"Upload returned non-success message: {message}"

        # Basic sanity: created_id should be non-empty
        assert created_id, "Created resource id is empty"

        print(f"TC006 PASS: Uploaded document item, id={created_id}")

    finally:
        # Cleanup: delete the created resource if possible
        if created_id:
            del_url = BASE_URL + DELETE_ENDPOINT_TEMPLATE.format(id=created_id)
            try:
                del_resp = session.delete(del_url, headers=headers, timeout=TIMEOUT)
                if del_resp.status_code not in (200, 202, 204):
                    print(f"Warning: failed to delete created item {created_id}: {del_resp.status_code} {del_resp.text}")
                else:
                    print(f"Cleanup: deleted item {created_id}")
            except RequestException as e:
                print(f"Warning: exception when deleting created item {created_id}: {e}")

        # Remove temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass


if __name__ == "__main__":
    test_post_api_vault_items_add_document()