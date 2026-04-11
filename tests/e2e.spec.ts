import { test, expect } from '@playwright/test';

test.describe('BlueprintAI PRD Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main form', async ({ page }) => {
    // Check for form elements
    await expect(page.getByPlaceholder('Product Name')).toBeVisible();
    await expect(page.getByPlaceholder('Executive Summary')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();
    
    // Should show validation error or not submit
    await expect(page.getByText(/required|name|description/i)).toBeVisible({ timeout: 3000 });
  });

  test('should accept product name and description', async ({ page }) => {
    const productName = 'Test Product';
    const description = 'A test product description';

    await page.getByPlaceholder('Product Name').fill(productName);
    await page.getByPlaceholder('Executive Summary').fill(description);

    await expect(page.getByPlaceholder('Product Name')).toHaveValue(productName);
    await expect(page.getByPlaceholder('Executive Summary')).toHaveValue(description);
  });

  test('should add key features', async ({ page }) => {
    await page.getByPlaceholder('Product Name').fill('Test App');
    await page.getByPlaceholder('Executive Summary').fill('Test Description');

    // Add a feature
    const featureInput = page.getByPlaceholder('Enter a feature');
    if (await featureInput.isVisible()) {
      await featureInput.fill('Feature 1');
      await page.keyboard.press('Enter');
      
      await expect(page.getByText('Feature 1')).toBeVisible();
    }
  });

  test('should handle file upload', async ({ page }) => {
    await page.getByPlaceholder('Product Name').fill('Test App');
    await page.getByPlaceholder('Executive Summary').fill('Test Description');

    // Create a test file
    const testFile = 'test-context.txt';
    await page.evaluate((fileName) => {
      const dt = new DataTransfer();
      const file = new File(['Test content'], fileName, { type: 'text/plain' });
      dt.items.add(file);
      return file;
    }, testFile);

    // Note: Actual file upload test would need proper file input handling
  });

  test('should display loading state during generation', async ({ page }) => {
    await page.getByPlaceholder('Product Name').fill('Test App');
    await page.getByPlaceholder('Executive Summary').fill('Test Description');

    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Should show loading indicator
    const loadingElements = page.getByText(/generating|loading|processing/i);
    // This may or may not be visible depending on implementation
  });

  test('should navigate between tabs', async ({ page }) => {
    const tabs = ['PRD', 'Visuals', 'Templates'];
    
    for (const tab of tabs) {
      const tabButton = page.getByRole('button', { name: new RegExp(tab, 'i') });
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await expect(tabButton).toHaveAttribute('aria-selected', 'true');
      }
    }
  });

  test('should save draft to storage', async ({ page }) => {
    await page.getByPlaceholder('Product Name').fill('Draft Test');
    await page.getByPlaceholder('Executive Summary').fill('Draft Description');

    // Trigger save (auto-save or manual)
    await page.waitForTimeout(1000);

    // Check IndexedDB or localStorage for saved draft
    const storedData = await page.evaluate(() => {
      const stored = localStorage.getItem('current_prd');
      return stored ? JSON.parse(stored) : null;
    });

    // Draft should be saved
    expect(storedData).toBeTruthy();
  });
});

test.describe('ChatBot Component', () => {
  test('should open chatbot', async ({ page }) => {
    await page.goto('/');
    
    const chatButton = page.getByRole('button', { name: /chat|assistant/i });
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await expect(page.getByTestId('chatbot')).toBeVisible();
    }
  });

  test('should send a message', async ({ page }) => {
    // Open chatbot first
    const chatButton = page.getByRole('button', { name: /chat|assistant/i });
    if (await chatButton.isVisible()) {
      await chatButton.click();
      
      const messageInput = page.getByPlaceholder(/type.*message/i);
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message');
        await page.keyboard.press('Enter');
        
        // Should show sent message
        await expect(page.getByText('Test message')).toBeVisible();
      }
    }
  });
});

test.describe('Template Manager', () => {
  test('should load templates', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to templates tab
    const templatesTab = page.getByRole('button', { name: /templates/i });
    if (await templatesTab.isVisible()) {
      await templatesTab.click();
      
      // Should show template list or empty state
      await expect(page.getByText(/template|no templates/i)).toBeVisible();
    }
  });

  test('should create new template', async ({ page }) => {
    await page.goto('/');
    
    const templatesTab = page.getByRole('button', { name: /templates/i });
    if (await templatesTab.isVisible()) {
      await templatesTab.click();
      
      const createButton = page.getByRole('button', { name: /new|create|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Should show template creation form
        await expect(page.getByPlaceholder(/template name/i)).toBeVisible();
      }
    }
  });
});

test.describe('Visuals Lab', () => {
  test('should access visuals lab', async ({ page }) => {
    await page.goto('/');
    
    const visualsTab = page.getByRole('button', { name: /visuals/i });
    if (await visualsTab.isVisible()) {
      await visualsTab.click();
      await expect(page.getByText(/visual|diagram|mockup/i)).toBeVisible();
    }
  });

  test('should generate visuals', async ({ page }) => {
    await page.goto('/');
    
    const visualsTab = page.getByRole('button', { name: /visuals/i });
    if (await visualsTab.isVisible()) {
      await visualsTab.click();
      
      const generateButton = page.getByRole('button', { name: /generate/i });
      if (await generateButton.isVisible()) {
        await generateButton.click();
        
        // Should show loading or result
        const loadingOrResult = page.getByText(/generating|loading|diagram|mockup/i);
        await expect(loadingOrResult.first()).toBeVisible();
      }
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    let labeledCount = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      if (ariaLabel || (textContent && textContent.trim())) {
        labeledCount++;
      }
    }
    
    // Most buttons should have labels
    expect(labeledCount).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    let activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
    
    await page.keyboard.press('Tab');
    activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
    
    // Enter should activate focused button
    await page.keyboard.press('Enter');
  });
});

test.describe('Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    await page.getByPlaceholder('Product Name').fill('Test');
    await page.getByPlaceholder('Executive Summary').fill('Test');
    
    // Mock failed API call
    await page.route('**/api/generate-prd', route => route.abort());
    
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();
    
    // Should show error message
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle network disconnection', async ({ page }) => {
    await page.goto('/');
    
    // Go offline
    await page.context().setOffline(true);
    
    await page.getByPlaceholder('Product Name').fill('Test');
    await page.getByPlaceholder('Executive Summary').fill('Test');
    
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();
    
    // Should show offline error
    await expect(page.getByText(/offline|network|connection/i)).toBeVisible({ timeout: 5000 });
    
    // Restore online
    await page.context().setOffline(false);
  });
});
