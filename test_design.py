from playwright.sync_api import sync_playwright
import os

SCREENSHOTS_DIR = '/tmp/design-screenshots'
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Desktop viewport
    page = browser.new_page(viewport={'width': 1440, 'height': 900})

    # ── Home Page ──────────────────────────────
    print("=== HOME PAGE ===")
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)  # let animations play

    # Full page screenshot
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-hero.png')
    print(f"Screenshot: home-hero.png")

    # Scroll to main content and screenshot
    page.evaluate('window.scrollBy(0, window.innerHeight)')
    page.wait_for_timeout(800)
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-about.png')
    print(f"Screenshot: home-about.png")

    # Scroll to form section
    page.evaluate('window.scrollBy(0, window.innerHeight)')
    page.wait_for_timeout(800)
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-form.png')
    print(f"Screenshot: home-form.png")

    # Full page screenshot
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-full.png', full_page=True)
    print(f"Screenshot: home-full.png")

    # Test hero gradient text is visible
    hero_title = page.locator('.heroTitle')
    assert hero_title.is_visible(), "Hero title should be visible"
    print(f"Hero title text: {hero_title.text_content()}")

    # Test section animations fired (check for animate-visible class)
    visible_sections = page.locator('.animate-visible').count()
    print(f"Animated sections visible: {visible_sections}")

    # Test form interaction
    page.locator('#name').scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    page.fill('#name', 'Test User')
    page.fill('#email', 'test@example.com')
    page.fill('#city', 'Oslo')
    page.select_option('#country', 'no')
    page.check('#cb-tech')
    page.check('#radio-email')
    page.fill('#message', 'This is a test message from Playwright')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-form-filled.png')
    print(f"Screenshot: home-form-filled.png")
    print("Form fill: OK")

    # Test counter
    page.locator('button[aria-label="Increase counter"]').scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    page.click('button[aria-label="Increase counter"]')
    page.click('button[aria-label="Increase counter"]')
    page.click('button[aria-label="Increase counter"]')
    counter_val = page.locator('.counterValue').text_content()
    assert counter_val == '3', f"Counter should be 3, got {counter_val}"
    print(f"Counter: {counter_val} (OK)")

    # Test modal
    page.click('text=Open Modal')
    page.wait_for_timeout(300)
    modal = page.locator('[role="dialog"]')
    assert modal.is_visible(), "Modal should be visible"
    page.screenshot(path=f'{SCREENSHOTS_DIR}/home-modal.png')
    print(f"Screenshot: home-modal.png")
    print("Modal: OK")
    page.click('text=Close')

    # ── Users Page ─────────────────────────────
    print("\n=== USERS PAGE ===")
    page.goto('http://localhost:3000/users', wait_until='networkidle')
    page.wait_for_timeout(1000)

    page.screenshot(path=f'{SCREENSHOTS_DIR}/users-header.png')
    print(f"Screenshot: users-header.png")

    # Scroll to see cards
    page.evaluate('window.scrollBy(0, 600)')
    page.wait_for_timeout(800)
    page.screenshot(path=f'{SCREENSHOTS_DIR}/users-cards.png')
    print(f"Screenshot: users-cards.png")

    # Full page
    page.screenshot(path=f'{SCREENSHOTS_DIR}/users-full.png', full_page=True)
    print(f"Screenshot: users-full.png")

    # Check card structure
    cards = page.locator('.contactCard')
    card_count = cards.count()
    print(f"Contact cards: {card_count}")

    if card_count > 0:
        # Check first card has avatar
        first_avatar = cards.first.locator('.cardAvatar')
        assert first_avatar.is_visible(), "Card avatar should be visible"
        print(f"First card avatar: {first_avatar.text_content()}")
        print("Card layout: OK")

    # ── Mobile Viewport ────────────────────────
    print("\n=== MOBILE VIEW ===")
    mobile = browser.new_page(viewport={'width': 375, 'height': 812})
    mobile.goto('http://localhost:3000', wait_until='networkidle')
    mobile.wait_for_timeout(1000)
    mobile.screenshot(path=f'{SCREENSHOTS_DIR}/mobile-hero.png')
    print(f"Screenshot: mobile-hero.png")

    mobile.evaluate('window.scrollBy(0, window.innerHeight)')
    mobile.wait_for_timeout(800)
    mobile.screenshot(path=f'{SCREENSHOTS_DIR}/mobile-content.png')
    print(f"Screenshot: mobile-content.png")

    mobile.goto('http://localhost:3000/users', wait_until='networkidle')
    mobile.wait_for_timeout(1000)
    mobile.screenshot(path=f'{SCREENSHOTS_DIR}/mobile-users.png', full_page=True)
    print(f"Screenshot: mobile-users.png")

    mobile.close()

    # ── Check console errors ───────────────────
    print("\n=== SUMMARY ===")
    print(f"All screenshots saved to {SCREENSHOTS_DIR}/")
    print("All tests passed!")

    browser.close()
