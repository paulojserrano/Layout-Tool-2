from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080/layout-tool.html")

    # Wait for the tab button to be visible
    page.wait_for_selector("button[data-tab='manualTabContent']")

    # Click on the "Manual" tab
    page.click("button[data-tab='manualTabContent']")

    # Wait for the manual tab content to be visible
    # Now it should be visible because we clicked the tab
    page.wait_for_selector("#manualTabContent", state="visible")

    # Select "Custom" in Tote Footprint
    page.select_option("#manualToteSizeSelect", "custom")

    # Verify custom inputs are visible
    page.wait_for_selector("#manualCustomToteContainer", state="visible")

    # Enter custom width and length
    page.fill("#manualCustomToteWidth", "500")
    page.fill("#manualCustomToteLength", "500")

    # Select "Custom" in Tote Height
    page.select_option("#manualToteHeightSelect", "custom")

    # Verify custom height input is visible
    page.wait_for_selector("#manualCustomToteHeightContainer", state="visible")

    # Enter custom height
    page.fill("#manualCustomToteHeight", "500")

    # Wait for layout update (debounced)
    page.wait_for_timeout(2000)

    # Take screenshot
    page.screenshot(path="verification_screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
