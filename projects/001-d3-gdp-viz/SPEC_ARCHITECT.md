# 📊 SPEC: China GDP Visualization (2000-2025) - Architect Version

## 1. Project Overview
Create a responsive bar chart using D3.js V7 to visualize China's Total GDP and GDP Per Capita from 2000 to 2025.

## 2. Technical Stack
- **Library:** D3.js V7 (via CDN)
- **Styling:** Vanilla CSS (Responsive SVG)
- **Color Scheme:** Observable 10 (d3.schemeTableau10 or d3.schemeCategory10)

## 3. Data Requirements (Mock 2000-2025)
Data points should follow a consistent growth trend. Fields:
- `year`: Integer
- `total_gdp`: Number (Trillions of USD)
- `gdp_per_capita`: Number (USD)

## 4. Visual Components
- **Chart Type:** Dual-layered bar chart or toggleable view.
- **Axes:** 
    - X-axis: Years (rotated labels if necessary).
    - Y-axis: Linear scale with clear units (T$ or $).
- **Tooltip:** 
    - Follows mouse cursor.
    - Shows Year, Total GDP, and Per Capita GDP with thousand separators.

## 5. Advanced Requirements (The "Hard" Part)
### 5.1 Keyboard Navigation (a11y)
- Each bar must be focusable (`tabindex="0"`).
- Use `aria-label` on each bar: "Year [X], Total GDP: [Y] Trillion USD".
- Focus should trigger the tooltip (same logic as hover).
- Visual focus ring must be clearly visible.

### 5.2 Responsiveness
- SVG `viewBox` must be used.
- Chart should resize container width while maintaining aspect ratio.
- Font sizes should scale or remain legible.

## 6. Development Workflow
1.  Initialize SVG with margins.
2.  Create scales (xScale: Band, yScale: Linear).
3.  Implement D3 Join pattern (Enter, Update, Exit).
4.  Add event listeners for `mouseover`, `mousemove`, `mouseout`, and `focus`, `blur`.
5.  Add keyboard event listener for `keydown` (Arrow keys to navigate bars).
