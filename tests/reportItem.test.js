/**
 * @jest-environment jsdom
 */

describe('Report item flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="reportBtn">Report</button>
    `;

    global.window.supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user1' } }
        })
      },

      from: jest.fn((table) => {
        if (table === 'reports') {
          return {
            insert: jest.fn().mockResolvedValue({})
          };
        }
      })
    };
  });

  test('user can report an item successfully', async () => {
    const insertMock = jest.fn().mockResolvedValue({});

    window.supabase.from = jest.fn((table) => {
      if (table === 'reports') {
        return {
          insert: insertMock
        };
      }
    });

    // fake report function (since yours isn't shown)
    async function reportItem(itemId, reason = 'spam') {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) return false;

      await window.supabase.from('reports').insert({
        user_id: user.id,
        item_id: itemId,
        reason
      });

      return true;
    }

    const result = await reportItem('item123', 'inappropriate');

    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user1',
      item_id: 'item123',
      reason: 'inappropriate'
    });

    expect(result).toBe(true);
  });
});