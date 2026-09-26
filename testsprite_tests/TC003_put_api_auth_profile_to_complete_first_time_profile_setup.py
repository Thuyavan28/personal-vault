import requests
import tempfile
import os
import io
import sys
import json

BASE_URL = "http://localhost:5000"
DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
TIMEOUT = 30


def extract_token(json_data):
    # Try common token locations
    if not isinstance(json_data, dict):
        return None
    for key in ("token", "accessToken", "access_token", "authToken"):
        if key in json_data and isinstance(json_data[key], str):
            return json_data[key]
    # nested under data
    if "data" in json_data and isinstance(json_data["data"], dict):
        for key in ("token", "accessToken", "access_token", "authToken"):
            if key in json_data["data"] and isinstance(json_data["data"][key], str):
                return json_data["data"][key]
    return None


def test_put_auth_profile_complete_setup():
    session = requests.Session()
    login_url = f"{BASE_URL}/api/auth/login"
    profile_url = f"{BASE_URL}/api/auth/profile"
    original_profile = None
    tmp_avatar_path = None

    try:
        # Step 1: Login with demo credentials
        try:
            resp = session.post(
                login_url,
                json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
                timeout=TIMEOUT,
            )
        except requests.RequestException as e:
            raise AssertionError(f"Login request failed: {e}")

        assert resp.status_code == 200, f"Expected 200 from login, got {resp.status_code}, body: {resp.text}"
        try:
            resp_json = resp.json()
        except ValueError:
            raise AssertionError(f"Login response is not valid JSON: {resp.text}")

        token = extract_token(resp_json)
        assert token, f"No auth token found in login response JSON: {json.dumps(resp_json)}"

        headers = {"Authorization": f"Bearer {token}"}

        # Optional: attempt to GET current profile to be able to restore it later if endpoint exists
        try:
            get_resp = session.get(profile_url, headers=headers, timeout=TIMEOUT)
            if get_resp.status_code == 200:
                try:
                    original_profile = get_resp.json()
                except ValueError:
                    original_profile = None
            else:
                original_profile = None
        except requests.RequestException:
            original_profile = None

        # Step 2: Prepare a small temporary avatar file
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\xdac\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x02\xfb\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        tmp_file.write(png_bytes)
        tmp_file.flush()
        tmp_file.close()
        tmp_avatar_path = tmp_file.name

        # Step 3: PUT profile update with full name, phone, and avatar file (multipart)
        full_name = "Demo User Test"
        phone = "+15550101001"
        files = {"avatar": ("avatar.png", open(tmp_avatar_path, "rb"), "image/png")}
        data = {"fullName": full_name, "phone": phone}

        try:
            put_resp = session.put(profile_url, headers=headers, files=files, data=data, timeout=TIMEOUT)
        finally:
            # ensure file is closed
            files["avatar"][1].close()

        assert put_resp.status_code in (200, 201, 204), f"Expected 200/201/204 from profile PUT, got {put_resp.status_code}, body: {put_resp.text}"

        # If response has JSON, validate returned profile fields
        try:
            put_json = put_resp.json()
        except ValueError:
            put_json = None

        if put_json and isinstance(put_json, dict):
            # Attempt to find the profile object in response
            profile_obj = put_json
            if "data" in put_json and isinstance(put_json["data"], dict):
                profile_obj = put_json["data"]
            # Validate fields if present
            if "fullName" in profile_obj:
                assert profile_obj["fullName"] == full_name, f"Returned fullName mismatch: expected {full_name}, got {profile_obj['fullName']}"
            elif "name" in profile_obj:
                # Accept alternate key
                assert profile_obj["name"] == full_name, f"Returned name mismatch: expected {full_name}, got {profile_obj['name']}"
            # Phone may be optional in response
            if "phone" in profile_obj:
                assert profile_obj["phone"] == phone, f"Returned phone mismatch: expected {phone}, got {profile_obj['phone']}"
            # Avatar may be returned as url
            if "avatar" in profile_obj:
                assert profile_obj["avatar"], "Avatar field present but empty"
        else:
            # No JSON returned; consider success by status code
            pass

        print("TC003 passed: profile updated successfully.")

    finally:
        # Cleanup: attempt to restore original profile if we fetched it earlier
        if original_profile and isinstance(original_profile, dict):
            try:
                # Try sending JSON restore. Some servers may expect multipart; ignore failures.
                restore_headers = {"Authorization": f"Bearer {extract_token(original_profile) or token}", "Content-Type": "application/json"}
                # Remove nested metadata if present and if it's not directly the profile payload
                payload = original_profile
                if "data" in original_profile and isinstance(original_profile["data"], dict):
                    payload = original_profile["data"]
                # Remove read-only fields that might cause PUT to fail
                for key in ("id", "_id", "createdAt", "updatedAt", "email"):
                    payload.pop(key, None)
                session.put(profile_url, headers=restore_headers, json=payload, timeout=TIMEOUT)
            except Exception:
                # best-effort restore, ignore any errors
                pass

        # Remove temporary avatar file
        if tmp_avatar_path and os.path.exists(tmp_avatar_path):
            try:
                os.unlink(tmp_avatar_path)
            except Exception:
                pass


if __name__ == "__main__":
    try:
        test_put_auth_profile_complete_setup()
    except AssertionError as e:
        print(f"Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error during test: {e}")
        sys.exit(2)
    sys.exit(0)