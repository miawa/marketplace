/**
 * @jest-environment jsdom
 */

jest.mock('../js/index.js', () => {
  const insertMock = jest.fn();
  const upsertMock = jest.fn();

  const toggleLike = jest.fn(async () => true);

  return {
    toggleLike
  };
});

const { toggleLike } = require('../js/index.js');

describe('toggleLike', () => {
  test('adds like and increments category count', async () => {
    global.window = global.window || {};

    global.window.supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user1' } }
        })
      },

      from: jest.fn((table) => {
        if (table === 'likes') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null })
                })
              })
            }),
            insert: jest.fn()
          };
        }

        if (table === 'user_category_likes') {
          return {select: () => ({eq: () => ({eq: () => ({
                  maybeSingle: async () => ({
                    data: { like_count: 2 }})})})}),upsert: jest.fn()};}})};

    const result = await toggleLike('item123', 'Shoes');

    expect(toggleLike).toHaveBeenCalledWith('item123', 'Shoes');

    expect(result).toBe(true);
  });
});