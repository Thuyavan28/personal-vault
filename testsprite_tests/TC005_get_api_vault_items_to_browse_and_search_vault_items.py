import requests
import time
import sys

BASE_URL = "http://localhost:5000"
DEMO_EMAIL = "demo@securevault.io"
DEMO_PASSWORD = "Password123!"
TIMEOUT = 30

def test_get_vault_items_browse_search():
    # Authenticate with demo credentials
    login_url = f"{BASE_URL}/api/auth/login"
    try:
        r = requests.post(login_url, json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")
    assert r.status_code == 200, f"Expected 200 from login, got {r.status_code}, body: {r.text}"
    try:
        auth_body = r.json()
    except ValueError:
        raise AssertionError(f"Login did not return JSON: {r.text}")

    # Extract token or fallback to session cookie
    token = None
    for key in ("token", "accessToken", "access_token", "authToken"):
        if isinstance(auth_body, dict) and key in auth_body:
            token = auth_body[key]
            break

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        # If no token, try to use cookies provided by the login response
        if r.cookies:
            # requests will handle cookies automatically if we reuse a session; convert cookies to header if needed
            session_cookie = "; ".join([f"{c.name}={c.value}" for c in r.cookies])
            if session_cookie:
                headers["Cookie"] = session_cookie
        else:
            raise AssertionError("Authentication failed: no token and no cookies returned from login")

    # Create a new credential item to ensure predictable search/filter results
    created_item_id = None
    created_item_title = f"test-search-item-{int(time.time())}"
    create_payload = {
        "title": created_item_title,
        "username": "testuser",
        "password": "Password123!",
        "notes": "Created by automated test",
        "category": "Passwords"
    }

    # Try POST to /api/vault/credentials; if that fails, try /api/vault/items
    created = None
    create_endpoints = [f"{BASE_URL}/api/vault/credentials", f"{BASE_URL}/api/vault/items"]
    for endpoint in create_endpoints:
        try:
            resp = requests.post(endpoint, headers={**headers, "Content-Type": "application/json"}, json=create_payload, timeout=TIMEOUT)
        except requests.RequestException as e:
            # try next endpoint
            resp = None
            last_exc = e
        if resp is None:
            continue
        if resp.status_code in (200, 201):
            try:
                created = resp.json()
            except ValueError:
                created = {}
            break
        # if endpoint returned 404 or 405, try next
        if resp.status_code in (404, 405):
            continue
        # other unexpected statuses -> still try next endpoint
    if created is None:
        raise AssertionError(f"Failed to create test item on endpoints {create_endpoints}. Last response: {resp.status_code if resp else 'no response'}")

    # Extract ID from creation response
    if isinstance(created, dict):
        created_item_id = created.get("id") or created.get("_id") or created.get("itemId") or created.get("item_id")
    # If still None, attempt to find id in nested structures
    if not created_item_id:
        # sometimes APIs return the created resource under 'data'
        if isinstance(created, dict) and "data" in created and isinstance(created["data"], dict):
            created_item_id = created["data"].get("id") or created["data"].get("_id")
    assert created_item_id, f"Could not determine created item ID from response: {created}"

    # Use try-finally to ensure cleanup
    try:
        # 1) GET all items and ensure our created item appears
        items_url = f"{BASE_URL}/api/vault/items"
        try:
            r_all = requests.get(items_url, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"GET {items_url} failed: {e}")
        assert r_all.status_code == 200, f"Expected 200 from GET /api/vault/items, got {r_all.status_code}, body: {r_all.text}"
        try:
            all_body = r_all.json()
        except ValueError:
            raise AssertionError(f"GET /api/vault/items did not return JSON: {r_all.text}")

        # Normalize items list extraction
        if isinstance(all_body, list):
            items_list = all_body
        elif isinstance(all_body, dict):
            if "items" in all_body and isinstance(all_body["items"], list):
                items_list = all_body["items"]
            elif "data" in all_body and isinstance(all_body["data"], list):
                items_list = all_body["data"]
            else:
                # attempt to find any list in the response
                items_list = next((v for v in all_body.values() if isinstance(v, list)), [])
        else:
            items_list = []

        assert isinstance(items_list, list), f"Unable to parse items list from GET /api/vault/items response: {all_body}"
        found_ids = set()
        for it in items_list:
            if isinstance(it, dict):
                candidate_id = it.get("id") or it.get("_id") or it.get("item_id") or it.get("itemId")
                if candidate_id:
                    found_ids.add(str(candidate_id))
        assert str(created_item_id) in found_ids, f"Created item id {created_item_id} not found in all items response"

        # 2) GET items filtered by category and ensure returned items match category and include our item
        category = "Passwords"
        try:
            r_cat = requests.get(items_url, headers=headers, params={"category": category}, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"GET {items_url}?category={category} failed: {e}")
        assert r_cat.status_code == 200, f"Expected 200 from GET /api/vault/items?category={category}, got {r_cat.status_code}, body: {r_cat.text}"
        try:
            cat_body = r_cat.json()
        except ValueError:
            raise AssertionError(f"GET /api/vault/items?category did not return JSON: {r_cat.text}")

        if isinstance(cat_body, list):
            cat_items = cat_body
        elif isinstance(cat_body, dict):
            if "items" in cat_body and isinstance(cat_body["items"], list):
                cat_items = cat_body["items"]
            elif "data" in cat_body and isinstance(cat_body["data"], list):
                cat_items = cat_body["data"]
            else:
                cat_items = next((v for v in cat_body.values() if isinstance(v, list)), [])
        else:
            cat_items = []

        assert isinstance(cat_items, list), f"Unable to parse category items list: {cat_body}"
        # Check that all returned items have category matching (if category field exists)
        for it in cat_items:
            if not isinstance(it, dict):
                continue
            cat_val = it.get("category") or it.get("type") or it.get("item_type")
            if cat_val:
                assert str(cat_val).lower() == category.lower(), f"Item {it} returned in category filter but has category {cat_val}"

        # Ensure our created item is present in category filtered results
        cat_ids = {str(it.get("id") or it.get("_id") or it.get("item_id") or it.get("itemId")) for it in cat_items if isinstance(it, dict)}
        assert str(created_item_id) in cat_ids, f"Created item id {created_item_id} not found in category '{category}' filtered results"

        # 3) GET items with search query matching the created item's title
        search_term = created_item_title.split("-")[-1]  # use unique suffix as search term
        try:
            r_search = requests.get(items_url, headers=headers, params={"q": created_item_title}, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"GET {items_url}?q={created_item_title} failed: {e}")
        assert r_search.status_code == 200, f"Expected 200 from GET /api/vault/items?q, got {r_search.status_code}, body: {r_search.text}"
        try:
            search_body = r_search.json()
        except ValueError:
            raise AssertionError(f"GET /api/vault/items?q did not return JSON: {r_search.text}")

        if isinstance(search_body, list):
            search_items = search_body
        elif isinstance(search_body, dict):
            if "items" in search_body and isinstance(search_body["items"], list):
                search_items = search_body["items"]
            elif "data" in search_body and isinstance(search_body["data"], list):
                search_items = search_body["data"]
            else:
                search_items = next((v for v in search_body.values() if isinstance(v, list)), [])
        else:
            search_items = []

        assert isinstance(search_items, list), f"Unable to parse search items list: {search_body}"
        # Ensure at least one returned item has title matching or containing the search term and includes our created item
        matched = False
        search_ids = set()
        for it in search_items:
            if not isinstance(it, dict):
                continue
            search_ids.add(str(it.get("id") or it.get("_id") or it.get("item_id") or it.get("itemId")))
            title = it.get("title") or it.get("name") or it.get("label")
            if title and created_item_title.lower() in str(title).lower():
                matched = True
        assert str(created_item_id) in search_ids, f"Created item id {created_item_id} not found in search results for query '{created_item_title}'"
        assert matched, f"Search results did not include an item with title containing '{created_item_title}'"

    finally:
        # Cleanup: attempt to delete the created item
        delete_attempts = [
            f"{BASE_URL}/api/vault/items/{created_item_id}",
            f"{BASE_URL}/api/vault/credentials/{created_item_id}",
            f"{BASE_URL}/api/vault/items/{created_item_id}/",  # trailing slash variant
            f"{BASE_URL}/api/vault/credentials/{created_item_id}/"
        ]
        delete_success = False
        for del_url in delete_attempts:
            try:
                resp_del = requests.delete(del_url, headers=headers, timeout=TIMEOUT)
            except requests.RequestException:
                resp_del = None
            if resp_del is None:
                continue
            if resp_del.status_code in (200, 204):
                delete_success = True
                break
            # 404 means not found, consider as success for cleanup
            if resp_del.status_code == 404:
                delete_success = True
                break
        if not delete_success:
            # If deletion didn't succeed, raise to indicate residual test data
            raise AssertionError(f"Failed to delete created test item {created_item_id}. Last delete response: {resp_del.status_code if resp_del else 'no response'}")

if __name__ == "__main__":
    try:
        test_get_vault_items_browse_search()
    except AssertionError as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
    print("TEST PASSED")
    sys.exit(0)