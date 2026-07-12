import { chromium } from '@playwright/test';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console events
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', exception => {
    console.log(`[BROWSER EXCEPTION] ${exception.message}`);
  });

  // Intercept and mock API requests
  await page.route('**/api/products/*', async route => {
    console.log('Mocking product API request...');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'cmqov5as001epch8somzazky',
        productId: 'cmqov5as001epch8somzazky',
        title: "Men's Luxury Chelsea Boots",
        price: 15000,
        compareAtPrice: 0,
        assets: {
          glb: { url: '/models/Shoe Sole Fixed.glb' },
          thumbnail: '/models/Shoe Sole Fixed.glb'
        },
        selectedMaterials: [
          {
            materialId: "m1",
            materialName: "Premium Hand Crafted Leather",
            selectedColorIds: ["c1", "c2"],
            selectedColor: [
              {
                id: "c1",
                name: "Black",
                imageUrl: "https://italian-shoes-color.s3.us-east-1.amazonaws.com/colors/6205c74f-4c94-47fb-a4bd-2a9cf2da61e7-luxury-black-leather-texture.jpg",
                family: "Black"
              },
              {
                id: "c2",
                name: "Brown",
                imageUrl: "https://italian-shoes-color.s3.us-east-1.amazonaws.com/colors/6205c74f-4c94-47fb-a4bd-2a9cf2da61e7-luxury-brown-leather-texture.jpg",
                family: "Brown"
              }
            ],
            selectAllColors: false
          }
        ],
        selectedStyles: [],
        selectedSoles: []
      })
    });
  });

  await page.route('**/api/sizes', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: "s1", name: "10", region: "US", value: 10 }
        ]
      })
    });
  });

  await page.route('**/api/panels', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { panelId: "Insole", name: "Insole" },
          { panelId: "Upper", name: "Upper" },
          { panelId: "Toe_Cap", name: "Toe_Cap" }
        ]
      })
    });
  });

  try {
    console.log('Navigating to http://localhost:3000/product/cmqov5as001epch8somzazky ...');
    await page.goto('http://localhost:3000/product/cmqov5as001epch8somzazky', { 
      timeout: 30000, 
      waitUntil: 'domcontentloaded' 
    });
    
    // Wait for the customizer tabs and swatches to render and model to load
    console.log('Waiting 8s for model and environment load...');
    await page.waitForTimeout(8000);

    // Find all swatch wrapper elements
    console.log('Searching for swatches...');
    const swatches = await page.$$('.rounded-full.cursor-pointer');
    console.log(`Found ${swatches.length} matching elements:`);
    for (let i = 0; i < swatches.length; i++) {
      const html = await swatches[i].evaluate(el => el.outerHTML);
      console.log(` - Element ${i}: ${html.substring(0, 150)}`);
    }

    if (swatches.length > 0) {
      // Find the element that contains an img child (the actual swatch!)
      let swatchToClick = null;
      for (const sw of swatches) {
        const hasImg = await sw.$('img');
        if (hasImg) {
          swatchToClick = sw;
          break;
        }
      }

      if (swatchToClick) {
        console.log('Clicking the color swatch element...');
        await swatchToClick.click();
        console.log('Waiting 5s for texture swapping to trigger...');
        await page.waitForTimeout(5000);
      } else {
        console.log('None of the matched elements had an image child. Clicking first element anyway...');
        await swatches[0].click();
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('No swatches found.');
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
