# TestSprite AI Backend API Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** SecureVault (Backend REST API)
- **Workspace:** `c:\Users\thuya\OneDrive\Desktop\New folder`
- **Date:** 2026-09-26
- **Test Runner:** TestSprite Automated MCP Agent & Python Requests Test Runner
- **Target URL:** `http://localhost:5000` (Node.js Express + Neon Serverless PostgreSQL)
- **Prepared By:** TestSprite AI Team & Antigravity Coding Assistant

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api auth login with valid credentials
- **Test Code:** [TC001_post_api_auth_login_with_valid_credentials.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC001_post_api_auth_login_with_valid_credentials.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/a4150c22-163b-4172-a849-3338736d8955)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Sent `POST /api/auth/login` with demo user credentials (`demo@securevault.io` / `Password123!`).
  - Successfully verified password hash via bcrypt, retrieved user row, reset failed login attempts counter, and issued a secure JWT token containing user id and email.
  - Returned HTTP 200 with complete user profile payload.

---

#### Test TC002 post api auth signup with new account details
- **Test Code:** [TC002_post_api_auth_signup_with_new_account_details.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC002_post_api_auth_signup_with_new_account_details.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/b5556740-a500-4563-a2c9-c2936e9524c5)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Submitted `POST /api/auth/signup` with a newly generated email, password, and confirmation password.
  - Successfully validated input schemas, hashed password with bcrypt (salt rounds = 10), and inserted row into Neon PostgreSQL `users` table.
  - Initialized `profile_completed: false` and `pin_hash: null` to properly flag user for first-time onboarding. Returned HTTP 201 with JWT token.

---

#### Test TC003 put api auth profile to complete first time profile setup
- **Test Code:** [TC003_put_api_auth_profile_to_complete_first_time_profile_setup.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC003_put_api_auth_profile_to_complete_first_time_profile_setup.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/b528f3b8-c65f-417b-89ae-45d3b4045ebc)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Authenticated user submitted updated profile information (`name`, `phone`, `avatarUrl`) via `PUT /api/auth/profile`.
  - Database updated columns and automatically toggled `profile_completed = true`.
  - Returned updated user JSON object with HTTP 200.

---

#### Test TC004 post api pin create to setup 4 digit security pin
- **Test Code:** [TC004_post_api_pin_create_to_setup_4_digit_security_pin.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC004_post_api_pin_create_to_setup_4_digit_security_pin.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/37985aaf-7318-42af-ba12-72e41cca2825)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Authenticated user submitted a matching 4-digit PIN via `POST /api/pin/create`.
  - Validated that the PIN is exactly 4 numerical digits. Hashed with bcrypt and saved into `users.pin_hash`.
  - Reset any previous failed attempts and lockout timers. Returned HTTP 200 `{ message: 'PIN created successfully', hasPin: true }`.

---

#### Test TC005 get api vault items to browse and search vault items
- **Test Code:** [TC005_get_api_vault_items_to_browse_and_search_vault_items.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC005_get_api_vault_items_to_browse_and_search_vault_items.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/85795b11-32c3-4917-8dca-959e62e16bcb)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Queried `GET /api/vault/items` with various filters (`?type=all`, `?type=credential`, `?type=document`, `?search=tax`).
  - Server executed parameterized SQL queries against `vault_items` table with tenant isolation (`user_id = req.user.id`).
  - Returned array of items with encrypted payloads stripped from the list view for security, returning only safe metadata (id, title, description, tags, type, timestamps).

---

#### Test TC006 post api vault items to add new document item
- **Test Code:** [TC006_post_api_vault_items_to_add_new_document_item.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC006_post_api_vault_items_to_add_new_document_item.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/2051d0aa-b63e-4715-9e8a-598e585596e4)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Sent `multipart/form-data` with attached document file, title, and tags to `POST /api/vault/items`.
  - Server encrypted the file bytes with AES-256-GCM, stored the ciphertext in `.vault_storage`, calculated SHA-256 checksum, and inserted database record into Neon PostgreSQL.
  - Returned HTTP 201 with saved item confirmation and recorded audit log.

---

#### Test TC007 post api vault credentials to add new password credential
- **Test Code:** [TC007_post_api_vault_credentials_to_add_new_password_credential.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC007_post_api_vault_credentials_to_add_new_password_credential.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/ad0eb28b-5aa9-4567-b14e-8089a9566885)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Submitted `POST /api/vault/credentials` with username, password, URL, notes, and tags.
  - Payload serialized to JSON and encrypted using AES-256-GCM with a unique 12-byte initialization vector (IV) and 16-byte authentication tag.
  - Inserted into `vault_items` and returned HTTP 201 with item metadata.

---

#### Test TC008 post api vault items id unlock to decrypt locked item
- **Test Code:** [TC008_post_api_vault_items_id_unlock_to_decrypt_locked_item.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC008_post_api_vault_items_id_unlock_to_decrypt_locked_item.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/034ea6bb-4d17-4015-b922-1e1ffb3e8b8d)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Sent `POST /api/vault/items/:id/unlock` with PIN `1234`.
  - Verified user's PIN against bcrypt hash in `users.pin_hash`.
  - Successfully decrypted the AES-256 ciphertext, computed SHA-256 checksum to verify integrity (`integrityVerified: true`), and returned cleartext fields.
  - Created audit log entry for `item_unlocked`.

---

#### Test TC009 post api pin verify to enforce pin verification and lockout
- **Test Code:** [TC009_post_api_pin_verify_to_enforce_pin_verification_and_lockout.py](file:///c:/Users/thuya/OneDrive/Desktop/New%20folder/testsprite_tests/TC009_post_api_pin_verify_to_enforce_pin_verification_and_lockout.py)
- **Test Visualization & Result:** [View Dashboard](https://www.testsprite.com/dashboard/mcp/tests/88f5c42d-4b86-5d54-90aa-a25daf20e513/test/39bbdf5f-6e53-4e1d-91a9-aac2da9e357f)
- **Status:** ✅ Passed
- **Analysis / Findings:**
  - Tested invalid PIN attempts via `POST /api/pin/verify`.
  - Incrementing counter `failed_pin_attempts` tracked consecutive failures.
  - Upon reaching 5 consecutive failures, backend activated 30-second lockout (`lockout_until = NOW() + 30s`) and returned HTTP 429 with remaining lockout seconds.
  - Verified that correct PIN submissions during active lockout remain blocked until the timer expires.

---

## 3️⃣ Coverage & Matching Metrics

- **Overall Pass Rate:** **100.00%** (9 of 9 Passed)
- **Live Endpoint Tested:** `http://localhost:5000`
- **Database Backend:** Neon Serverless PostgreSQL with auto-retry pool

| API Route Group | Endpoints Tested | Status | Pass % |
|:---|:---|:---:|:---:|
| **Authentication & Registration** | `POST /api/auth/login`, `POST /api/auth/signup` | ✅ Passed | 100% |
| **Profile Management** | `PUT /api/auth/profile` | ✅ Passed | 100% |
| **PIN Security & Lockout** | `POST /api/pin/create`, `POST /api/pin/verify` | ✅ Passed | 100% |
| **Vault Storage & Listing** | `GET /api/vault/items`, `POST /api/vault/items` | ✅ Passed | 100% |
| **Credential Encryption** | `POST /api/vault/credentials` | ✅ Passed | 100% |
| **Cryptographic Decryption** | `POST /api/vault/items/:id/unlock` | ✅ Passed | 100% |
| **Total** | **9 / 9 Endpoints** | ✅ **ALL PASSED** | **100.00%** |

---

## 4️⃣ Key Gaps / Risks Resolved During Testing

1. **Missing or Null `file_path` Protection in Unlock Route:**
   - **Discovered:** When unlocking items that don't have disk files or use custom storage, `path.join(UPLOADS_DIR, item.file_path)` could throw `TypeError: path must be string`.
   - **Fix Applied:** In `server/routes/vault.js`, added guard clause for `!item.file_path` to safely return unlocked metadata without disk lookup errors.

2. **Neon Serverless Resilient Retries:**
   - **Discovered:** AWS Neon compute wakeups can drop idle connections.
   - **Fix Applied:** `executeWithRetry()` auto-retries failed queries immediately with fresh pool connections.

3. **Demo User Category Completeness:**
   - **Discovered:** Demo account required all categories (credential, document, photo, secret) to be populated for end-to-end tests.
   - **Fix Applied:** Updated `initDatabase()` in `server/db/database.js` to ensure all 4 item types exist for `demo@securevault.io`.
