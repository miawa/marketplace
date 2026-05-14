/**
 * @jest-environment jsdom
 */

describe('Search filtering UI', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="searchInput" />
      <div id="productGrid"></div>
      <div id="loadingSpinner"></div>
    `;

  
    global.allItems = [
      {
        id: '1',
        title: 'Nike Shoes',
        description: 'Running shoes',
        brand: 'Nike',
        price: 50,
        category: 'Clothing',
        condition: 'New',
        item_images: [],
        users: { username: 'keith', avatar_url: null }
      },
      {
        id: '2',
        title: 'Computer science textbook',
        description: 'Textbook for CS',
        brand: 'pearson',
        price: 7,
        category: 'Textbooks',
        condition: 'Used',
        item_images: [],
        users: { username: 'mia', avatar_url: null }
      }
    ];

    global.currentFilter = '';

    
    global.getFilteredItems = function () {
      return global.allItems.filter(item => {
        return (
          item.title.toLowerCase().includes(global.currentFilter.toLowerCase()) ||
          item.description.toLowerCase().includes(global.currentFilter.toLowerCase()) ||
          item.brand.toLowerCase().includes(global.currentFilter.toLowerCase())
        );
      });
    };

    global.render = function () {
      const grid = document.getElementById('productGrid');
      const items = global.getFilteredItems();

      grid.innerHTML = items.map(i => `<div>${i.title}</div>`).join('');
    };
  });

  test('filters products based on search input', () => {
    const input = document.getElementById('searchInput');

    input.addEventListener('input', (e) => {
      global.currentFilter = e.target.value;
      global.render();
    });

    
    input.value = 'computer science';
    input.dispatchEvent(new Event('input'));

    const grid = document.getElementById('productGrid');

    expect(grid.innerHTML).toContain('Computer science textbook');
    expect(grid.innerHTML).not.toContain('Nike shoes');
  });
});