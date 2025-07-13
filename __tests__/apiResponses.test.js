const { success, error, paginate } = require('../src/utils/apiResponses');

describe('apiResponses utility', () => {
  const createRes = () => {
    return {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
  };

  test('success sends formatted success response', () => {
    const res = createRes();
    success(res, 'ok', { foo: 'bar' }, 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'ok',
      data: { foo: 'bar' },
      timestamp: expect.any(String)
    });
  });

  test('error sends formatted error response', () => {
    const res = createRes();
    error(res, 'fail', 400, ['oops']);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'fail',
      errors: ['oops'],
      timestamp: expect.any(String)
    });
  });

  test('paginate sends formatted pagination response', () => {
    const res = createRes();
    paginate(res, 'listed', ['a', 'b'], 2, 1, 2, 206);
    expect(res.statusCode).toBe(206);
    expect(res.body).toEqual({
      success: true,
      message: 'listed',
      data: ['a', 'b'],
      pagination: {
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2
      },
      timestamp: expect.any(String)
    });
  });
});

