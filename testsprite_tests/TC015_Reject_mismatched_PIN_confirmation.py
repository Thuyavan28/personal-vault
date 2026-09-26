import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Create Vault' button to open the account creation view.
        # New to SecureVault? Create Vault button
        elem = page.get_by_role("button", name="New to SecureVault? Create")
        await elem.click(timeout=10000)
        
        # -> Fill the 'Email Address' field with demo@securevault.io, fill 'Master Password' and 'Confirm Master Password' with Password123!, then click the 'Create Vault & Set PIN' button.
        # you@example.com email field
        elem = page.get_by_role("textbox", name="you@example.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("demo@securevault.io")
        
        # -> Fill the 'Email Address' field with demo@securevault.io, fill 'Master Password' and 'Confirm Master Password' with Password123!, then click the 'Create Vault & Set PIN' button.
        # •••••••••••• password field
        elem = page.locator("div").filter(has_text=re.compile(r"^Master Password$")).get_by_placeholder("••••••••••••")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill the 'Email Address' field with demo@securevault.io, fill 'Master Password' and 'Confirm Master Password' with Password123!, then click the 'Create Vault & Set PIN' button.
        # •••••••••••• password field
        elem = page.locator("div").filter(has_text=re.compile(r"^Confirm Master Password$")).get_by_placeholder("••••••••••••")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill the 'Email Address' field with demo@securevault.io, fill 'Master Password' and 'Confirm Master Password' with Password123!, then click the 'Create Vault & Set PIN' button.
        # Create Vault & Set PIN button
        elem = page.get_by_role("button", name="Create Vault & Set PIN")
        await elem.click(timeout=10000)
        
        # -> Fill a new email in the Email Address field, confirm the Master Password fields, and click the 'Create Vault & Set PIN' button to reach the PIN setup screen.
        # you@example.com email field
        elem = page.get_by_role("textbox", name="you@example.com")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("pin-mismatch-test+1@securevault.io")
        
        # -> Fill a new email in the Email Address field, confirm the Master Password fields, and click the 'Create Vault & Set PIN' button to reach the PIN setup screen.
        # •••••••••••• password field
        elem = page.locator("div").filter(has_text=re.compile(r"^Master Password$")).get_by_placeholder("••••••••••••")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill a new email in the Email Address field, confirm the Master Password fields, and click the 'Create Vault & Set PIN' button to reach the PIN setup screen.
        # •••••••••••• password field
        elem = page.locator("div").filter(has_text=re.compile(r"^Confirm Master Password$")).get_by_placeholder("••••••••••••")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Password123!")
        
        # -> Fill a new email in the Email Address field, confirm the Master Password fields, and click the 'Create Vault & Set PIN' button to reach the PIN setup screen.
        # Create Vault & Set PIN button
        elem = page.get_by_role("button", name="Create Vault & Set PIN")
        await elem.click(timeout=10000)
        
        # -> Click the 'Skip for now →' button to proceed to the Verify step where PIN entry fields should appear.
        # Skip for now → button
        elem = page.get_by_role("button", name="Skip for now →")
        await elem.click(timeout=10000)
        
        # -> Click the 'Confirm & Save →' button to open the PIN setup screen.
        # Confirm & Save → button
        elem = page.get_by_role("button", name="Confirm & Save →")
        await elem.click(timeout=10000)
        
        # -> Enter a 4-digit PIN using the on-screen keypad (tap '1', '2', '3', '4').
        # 1 button
        elem = page.get_by_role("button", name="1")
        await elem.click(timeout=10000)
        
        # -> Enter a 4-digit PIN using the on-screen keypad (tap '1', '2', '3', '4').
        # 2 button
        elem = page.get_by_role("button", name="2")
        await elem.click(timeout=10000)
        
        # -> Enter a 4-digit PIN using the on-screen keypad (tap '1', '2', '3', '4').
        # 3 button
        elem = page.get_by_role("button", name="3")
        await elem.click(timeout=10000)
        
        # -> Enter a 4-digit PIN using the on-screen keypad (tap '1', '2', '3', '4').
        # 4 button
        elem = page.get_by_role("button", name="4")
        await elem.click(timeout=10000)
        
        # -> Re-enter a different 4-digit PIN using the on-screen keypad (enter '1','2','3','5') to trigger and observe a PIN mismatch error.
        # 1 button
        elem = page.get_by_role("button", name="1")
        await elem.click(timeout=10000)
        
        # -> Re-enter a different 4-digit PIN using the on-screen keypad (enter '1','2','3','5') to trigger and observe a PIN mismatch error.
        # 2 button
        elem = page.get_by_role("button", name="2")
        await elem.click(timeout=10000)
        
        # -> Re-enter a different 4-digit PIN using the on-screen keypad (enter '1','2','3','5') to trigger and observe a PIN mismatch error.
        # 3 button
        elem = page.get_by_role("button", name="3")
        await elem.click(timeout=10000)
        
        # -> Re-enter a different 4-digit PIN using the on-screen keypad (enter '1','2','3','5') to trigger and observe a PIN mismatch error.
        # 5 button
        elem = page.get_by_role("button", name="5")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> A PIN mismatch error message is shown when the confirmation PIN differs from the initial PIN.
        # Assert-outcome: passed
        # Assert: Verify the PIN mismatch error text is shown.
        await expect(page.locator("#root").nth(0)).to_contain_text("PINs do not match. Please try setting your PIN again.", timeout=15000), "Verify the PIN mismatch error text is shown."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    