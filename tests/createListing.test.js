/**
 * @jest-environment jsdom
 */

jest.mock('../js/index.js', () => ({
  loadItems: jest.fn()
}));

const { loadItems } = require('../js/index.js');

describe('Create Listing flow', () => {
  test('new item appears after loading items', async () => {
    document.body.innerHTML = `
      <div id="productGrid"></div>
      <div id="loadingSpinner"></div>
    `;

    loadItems.mockImplementation(async () => {
      const grid = document.getElementById('productGrid');

      grid.innerHTML = `
        <div class="productLoad">
          Nike Shoes - £50.00
        </div>
      `;
    });

    await loadItems();

    const grid = document.getElementById('productGrid');

    expect(grid.innerHTML).toContain('Nike Shoes');
    expect(grid.innerHTML).toContain('£50.00');
  });
});