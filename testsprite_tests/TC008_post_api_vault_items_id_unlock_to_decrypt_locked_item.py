import requests
import sys
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
DEMO_PIN = "1234"


def test_post_api_vault_items_id_unlock():
    # 1) Authenticate
    login_url = f"{BASE_URL}/api/auth/login"
    try:
        r = requests.post(login_url, json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=TIMEOUT)
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")
    assert r.status_code in (200, 201), f"Login failed: {r.status_code} - {r.text}"
    login_json = r.json()
    # Extract token from common keys
    token = None
    for k in ("token", "accessToken", "access_token", "jwt"):
        if k in login_json and login_json[k]:
            token = login_json[k]
            break
    # Some APIs nest tokens under 'data' or similar
    if not token:
        if isinstance(login_json.get("data"), dict):
            for k in ("token", "accessToken", "access_token", "jwt"):
                if k in login_json["data"] and login_json["data"][k]:
                    token = login_json["data"][k]
                    break
    assert token, f"Auth token not found in login response: {login_json}"

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2) Try to find an existing locked item
    items_url = f"{BASE_URL}/api/vault/items"
    try:
        r = requests.get(items_url, headers=headers, timeout=TIMEOUT)
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"Failed to list vault items: {e}")
    assert r.status_code == 200, f"Failed to fetch items: {r.status_code} - {r.text}"
    items_json = r.json()

    # Normalize list of items
    candidates = []
    if isinstance(items_json, list):
        candidates = items_json
    elif isinstance(items_json, dict):
        # common patterns: { "items": [...]} or {"data": [...]} or direct object with id fields
        if "items" in items_json and isinstance(items_json["items"], list):
            candidates = items_json["items"]
        elif "data" in items_json and isinstance(items_json["data"], list):
            candidates = items_json["data"]
        else:
            # possibly a single item returned; try to detect
            # treat dict as item if it has id-like keys
            if any(k in items_json for k in ("id", "_id")):
                candidates = [items_json]

    locked_item = None
    locked_item_secret = None
    locked_item_id = None

    def is_locked_field(item):
        # check common fields that indicate lock
        for fk in ("locked", "is_locked", "isLocked", "status", "lockedAt"):
            if fk in item:
                val = item[fk]
                # treat boolean True or string 'locked' as locked
                if isinstance(val, bool) and val:
                    return True
                if isinstance(val, str) and val.lower() in ("locked", "true"):
                    return True
        return False

    for it in candidates:
        try:
            if is_locked_field(it):
                locked_item = it
                break
        except Exception:
            continue

    created_item_id = None
    created_flag = False

    # 3) If no locked item found, create one (and ensure cleanup later)
    if not locked_item:
        create_url = f"{BASE_URL}/api/vault/items"
        # Choose a payload that many vault item endpoints accept; keep minimal sensible fields.
        payload = {
            "title": f"Automated Test Locked Item {int(time.time())}",
            "category": "Passwords",
            "type": "credential",
            # include a sensitive field we expect to be decrypted
            "sensitive": {"password": "secret-unlock-value-xyz"},
            # request the server to mark it locked/pin-protected if supported
            "locked": True,
            "pin_protected": True,
        }
        try:
            r = requests.post(create_url, headers=headers, json=payload, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Failed to create test item: {e}")
        assert r.status_code in (200, 201), f"Failed to create item: {r.status_code} - {r.text}"
        created = r.json()
        # extract id
        for key in ("id", "_id"):
            if key in created:
                created_item_id = created[key]
                break
        # maybe nested under 'data'
        if not created_item_id and isinstance(created.get("data"), dict):
            for key in ("id", "_id"):
                if key in created["data"]:
                    created_item_id = created["data"][key]
                    break
        assert created_item_id, f"Created item id not found in response: {created}"
        created_flag = True
        # store expected secret
        if "sensitive" in created and isinstance(created["sensitive"], dict):
            locked_item_secret = created["sensitive"].get("password")
        elif isinstance(created.get("data"), dict) and "sensitive" in created["data"]:
            locked_item_secret = created["data"]["sensitive"].get("password")
        # set id for unlocking
        locked_item_id = created_item_id
    else:
        # extract id and any known secret
        for key in ("id", "_id"):
            if key in locked_item:
                locked_item_id = locked_item[key]
                break
        if not locked_item_id and isinstance(locked_item.get("data"), dict):
            for key in ("id", "_id"):
                if key in locked_item["data"]:
                    locked_item_id = locked_item["data"][key]
                    break
        # try to find secret placeholder
        if "sensitive" in locked_item and isinstance(locked_item["sensitive"], dict):
            locked_item_secret = locked_item["sensitive"].get("password")
        elif isinstance(locked_item.get("data"), dict) and "sensitive" in locked_item["data"]:
            locked_item_secret = locked_item["data"]["sensitive"].get("password")

    assert locked_item_id, "No locked item id available for unlock test"

    # Use try/finally to ensure cleanup if we created the item
    try:
        # 4) Attempt to unlock with correct PIN
        unlock_url = f"{BASE_URL}/api/vault/items/{locked_item_id}/unlock"
        try:
            r = requests.post(unlock_url, headers=headers, json={"pin": DEMO_PIN}, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Unlock request failed: {e}")

        assert r.status_code == 200, f"Unlock failed: {r.status_code} - {r.text}"
        unlock_json = r.json()

        # 5) Validate decrypted sensitive details present
        # Look for common decrypted fields
        possible_paths = []
        # top-level keys
        possible_paths.extend(["decrypted", "data", "content", "sensitive", "secret", "password", "credentials"])
        found_decrypted_value = None

        # helper to probe nested dicts
        def probe_for_secret(obj):
            if not isinstance(obj, dict):
                return None
            # direct keys
            for k in ("decrypted", "sensitive", "data", "content", "secret", "password", "credentials"):
                if k in obj and obj[k]:
                    # if it's a dict, try to find common value keys inside
                    if isinstance(obj[k], dict):
                        for subk in ("password", "secret", "value", "content"):
                            if subk in obj[k] and obj[k][subk]:
                                return obj[k][subk]
                        # if dict but no known subkey, return the dict itself as evidence
                        return obj[k]
                    else:
                        return obj[k]
            # try nested 'data' or 'item'
            for nested_key in ("item", "data"):
                if nested_key in obj and isinstance(obj[nested_key], dict):
                    res = probe_for_secret(obj[nested_key])
                    if res:
                        return res
            return None

        found_decrypted_value = probe_for_secret(unlock_json)
        assert found_decrypted_value is not None, f"No decrypted sensitive details found in unlock response: {unlock_json}"

        # If we created the item and know original secret, verify it matches
        if locked_item_secret:
            # if found_decrypted_value is dict, stringify check
            if isinstance(found_decrypted_value, dict):
                # try to find password key
                val = found_decrypted_value.get("password") or found_decrypted_value.get("secret")
                assert val == locked_item_secret, f"Decrypted value mismatch: expected {locked_item_secret}, got {val}"
            else:
                assert str(found_decrypted_value) == str(locked_item_secret), f"Decrypted value mismatch: expected {locked_item_secret}, got {found_decrypted_value}"

        print("TEST PASSED: Successfully unlocked item and received decrypted details.")
    finally:
        # cleanup created item
        if created_flag and created_item_id:
            delete_url = f"{BASE_URL}/api/vault/items/{created_item_id}"
            try:
                dr = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                if dr.status_code not in (200, 204):
                    # best-effort delete; raise a warning
                    print(f"Warning: failed to delete created test item {created_item_id}: {dr.status_code} - {dr.text}", file=sys.stderr)
            except requests.exceptions.RequestException as e:
                print(f"Warning: exception during cleanup delete: {e}", file=sys.stderr)


if __name__ == "__main__":
    test_post_api_vault_items_id_unlock()