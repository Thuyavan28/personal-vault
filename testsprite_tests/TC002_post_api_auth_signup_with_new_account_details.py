import requests
import uuid
import sys
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_signup_with_new_account_details():
    """
    Test Case TC002:
    Verify that users can create a new vault account by submitting valid email and password via POST /api/auth/signup.
    """
    email = f"autotest+{uuid.uuid4().hex[:8]}@securevault.io"
    password = "Password123!"
    signup_url = f"{BASE_URL}/api/auth/signup"
    headers = {"Content-Type": "application/json"}

    created_user_id = None
    auth_token = None
    resp_json = None

    try:
        try:
            resp = requests.post(signup_url, json={"email": email, "password": password}, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Request to signup endpoint failed: {e}")

        assert resp is not None, "No response received from signup endpoint"
        assert resp.status_code in (200, 201), f"Unexpected signup status code: {resp.status_code}, body: {resp.text}"

        try:
            resp_json = resp.json()
        except ValueError:
            raise AssertionError(f"Signup response is not valid JSON: {resp.text}")

        # Try to locate user object and token in response flexibly
        user_obj = None
        possible_token_keys = ("token", "accessToken", "access_token", "jwt")
        possible_user_keys = ("user", "data", "account")

        # If top-level contains direct fields
        for key in possible_user_keys:
            if isinstance(resp_json, dict) and key in resp_json and isinstance(resp_json[key], dict):
                user_obj = resp_json[key]
                break

        if user_obj is None and isinstance(resp_json, dict):
            # maybe the response body IS the user object
            # Heuristic: presence of 'email' indicates user object
            if "email" in resp_json:
                user_obj = resp_json

        assert user_obj is not None, f"Could not find user object in signup response: {resp_json}"

        # Validate returned email matches the one we sent (case-insensitive)
        returned_email = user_obj.get("email") if isinstance(user_obj, dict) else None
        assert returned_email is not None, f"Signup response user object missing 'email' field: {user_obj}"
        assert returned_email.lower() == email.lower(), f"Returned email '{returned_email}' does not match sent email '{email}'"

        # Extract user id if present
        for id_key in ("id", "_id", "userId", "uuid"):
            if isinstance(user_obj, dict) and id_key in user_obj:
                created_user_id = str(user_obj[id_key])
                break

        # Extract auth token if present
        if isinstance(resp_json, dict):
            for tk in possible_token_keys:
                if tk in resp_json and isinstance(resp_json[tk], str):
                    auth_token = resp_json[tk]
                    break
            # token might be inside a nested object
            if auth_token is None:
                for k in resp_json:
                    if isinstance(resp_json[k], dict):
                        for tk in possible_token_keys:
                            if tk in resp_json[k] and isinstance(resp_json[k][tk], str):
                                auth_token = resp_json[k][tk]
                                break
                    if auth_token:
                        break

        # At least ensure we have confirmation fields present
        # Optionally the API may return a success flag
        if isinstance(resp_json, dict) and "success" in resp_json:
            assert resp_json["success"] is True, f"Signup response returned success=false: {resp_json}"

        print(f"Signup succeeded for email={email}, user_id={created_user_id}, token_present={auth_token is not None}")

    finally:
        # Cleanup: Attempt to delete the created user account if possible.
        # Try a few plausible delete endpoints. If deletion is not supported, attempt will be logged but will not fail the test.
        delete_attempted = False
        delete_succeeded = False

        if created_user_id or auth_token:
            # Build authorization header if token is available
            auth_headers = {"Content-Type": "application/json"}
            if auth_token:
                auth_headers["Authorization"] = f"Bearer {auth_token}"

            delete_endpoints = []
            if created_user_id:
                delete_endpoints.extend([
                    f"{BASE_URL}/api/auth/{created_user_id}",
                    f"{BASE_URL}/api/users/{created_user_id}",
                    f"{BASE_URL}/api/user/{created_user_id}"
                ])
            # Generic account deletion endpoints (may require auth)
            delete_endpoints.extend([
                f"{BASE_URL}/api/auth/delete",
                f"{BASE_URL}/api/auth/remove",
                f"{BASE_URL}/api/users/delete"
            ])

            for url in delete_endpoints:
                try:
                    delete_attempted = True
                    resp = requests.delete(url, headers=auth_headers, timeout=TIMEOUT)
                except requests.RequestException:
                    # Try next endpoint if network error
                    continue

                # Consider deletion successful if 200/202/204 returned
                if resp is not None and resp.status_code in (200, 202, 204):
                    delete_succeeded = True
                    break
                # Some APIs might require POST to a delete action
                if resp is not None and resp.status_code in (400, 401, 404):
                    # try next possibility
                    continue

            # As a last resort, if deletion endpoints above failed but we have credentials, try authenticated endpoint that accepts email to remove
            if not delete_succeeded and auth_token:
                try:
                    resp = requests.post(f"{BASE_URL}/api/auth/delete", headers=auth_headers, json={"email": email}, timeout=TIMEOUT)
                    if resp is not None and resp.status_code in (200, 202, 204):
                        delete_succeeded = True
                except requests.RequestException:
                    pass

        # If deletion was attempted but not successful, log to stderr (cleanup failure should not mask test result)
        if delete_attempted and not delete_succeeded:
            print(f"Warning: attempted to delete created account (email={email}, id={created_user_id}) but could not confirm deletion.", file=sys.stderr)
        elif delete_succeeded:
            print(f"Cleanup: successfully deleted created account (email={email}, id={created_user_id}).")

if __name__ == "__main__":
    test_post_api_auth_signup_with_new_account_details()
    print("TC002 completed.")