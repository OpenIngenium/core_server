'use strict';

// Coverage for VenueService and VenueGroupService (CRUD with optional query
// params and http_code_at_source-aware error handling).

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  createVenue: jest.fn(),
  deleteVenue: jest.fn(),
  getVenue: jest.fn(),
  getVenueStatus: jest.fn(),
  getVenues: jest.fn(),
  updateVenue: jest.fn(),
  updateVenueStatus: jest.fn(),
  createVenueGroup: jest.fn(),
  getVenueGroup: jest.fn(),
  getVenueGroups: jest.fn(),
  updateVenueGroup: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const Venue = require('../../../api/controllers/VenueService');
const VenueGroup = require('../../../api/controllers/VenueGroupService');

const H = { authorization: 'Bearer t' };
const noop = () => {};

function createRes() {
  const res = { statusCode: 0, body: undefined, headers: {}, ended: false };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.set = jest.fn((n, v) => { res.headers[n] = v; return res; });
  res.end = jest.fn(() => { res.ended = true; return res; });
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err, http_code_at_source: 0 }));
});

// Exercises the `http_code_at_source ? that : 400` error branch both ways.
async function expectHttpCodeError(fn, args, mockFn) {
  node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 409 });
  mockFn.mockRejectedValueOnce(new Error('x'));
  let res = createRes();
  await fn(args, res, noop, H);
  expect(res.statusCode).toBe(409);

  node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 0 });
  mockFn.mockRejectedValueOnce(new Error('x'));
  res = createRes();
  await fn(args, res, noop, H);
  expect(res.statusCode).toBe(400);
}

describe('VenueService', () => {
  it('create_venue: success + error(400)', async () => {
    node_funcs.createVenue.mockResolvedValue({ id: 'v1' });
    const res = createRes();
    await Venue.create_venue({ venue: sv({ name: 'n' }) }, res, noop, H);
    expect(node_funcs.createVenue).toHaveBeenCalledWith({ name: 'n' }, 'AUTHKEY');
    expect(res.body).toEqual({ id: 'v1' });

    node_funcs.createVenue.mockRejectedValue(new Error('x'));
    const res2 = createRes();
    await Venue.create_venue({ venue: sv({}) }, res2, noop, H);
    expect(res2.statusCode).toBe(400);
  });

  it('delete_venue: 204 + error(400)', async () => {
    node_funcs.deleteVenue.mockResolvedValue();
    const res = createRes();
    await Venue.delete_venue({ venue_id: sv('v1') }, res, noop, H);
    expect(node_funcs.deleteVenue).toHaveBeenCalledWith('v1', 'AUTHKEY');
    expect(res.statusCode).toBe(204);

    node_funcs.deleteVenue.mockRejectedValue(new Error('x'));
    const res2 = createRes();
    await Venue.delete_venue({ venue_id: sv('v1') }, res2, noop, H);
    expect(res2.statusCode).toBe(400);
  });

  it('get_venue: success + http-code error', async () => {
    node_funcs.getVenue.mockResolvedValue({ id: 'v1' });
    const res = createRes();
    await Venue.get_venue({ venue_id: sv('v1') }, res, noop, H);
    expect(node_funcs.getVenue).toHaveBeenCalledWith('v1', 'AUTHKEY');
    expect(res.body).toEqual({ id: 'v1' });
    await expectHttpCodeError(Venue.get_venue, { venue_id: sv('v1') }, node_funcs.getVenue);
  });

  it('get_venue_status: success + http-code error', async () => {
    node_funcs.getVenueStatus.mockResolvedValue({ status: 'AVAILABLE' });
    const res = createRes();
    await Venue.get_venue_status({ venue_id: sv('v1') }, res, noop, H);
    expect(node_funcs.getVenueStatus).toHaveBeenCalledWith('v1', 'AUTHKEY');
    await expectHttpCodeError(Venue.get_venue_status, { venue_id: sv('v1') }, node_funcs.getVenueStatus);
  });

  it('get_venues: all params + no params + http-code error', async () => {
    node_funcs.getVenues.mockResolvedValue({ venues: [1], total_count: 1 });
    let res = createRes();
    const allArgs = {
      description: sv('d'), status: sv('AVAILABLE'), exclude_status: sv('DOWN'),
      offset: sv(0), limit: sv(10), sort: sv('ASC'), venue_type: sv('t'),
      venue_name: sv('n'), venue_group_name: sv('g'), venue_group_status: sv('ACTIVE')
    };
    await Venue.get_venues(allArgs, res, noop, H);
    expect(node_funcs.getVenues).toHaveBeenCalledWith({
      description: 'd', status: 'AVAILABLE', exclude_status: 'DOWN', offset: 0,
      limit: 10, sort: 'ASC', venue_type: 't', venue_name: 'n',
      venue_group_name: 'g', venue_group_status: 'ACTIVE'
    }, 'AUTHKEY');
    expect(res.headers['x-total-count']).toBe(1);

    node_funcs.getVenues.mockResolvedValue({ venues: [], total_count: 0 });
    res = createRes();
    await Venue.get_venues({}, res, noop, H);
    expect(node_funcs.getVenues).toHaveBeenCalledWith({}, 'AUTHKEY');

    await expectHttpCodeError(Venue.get_venues, {}, node_funcs.getVenues);
  });

  it('update_venue: 204 + http-code error', async () => {
    node_funcs.updateVenue.mockResolvedValue();
    const res = createRes();
    await Venue.update_venue({ venue_id: sv('v1'), venue: sv({ n: 1 }) }, res, noop, H);
    expect(node_funcs.updateVenue).toHaveBeenCalledWith('v1', { n: 1 }, 'AUTHKEY');
    expect(res.statusCode).toBe(204);
    await expectHttpCodeError(Venue.update_venue, { venue_id: sv('v1'), venue: sv({}) }, node_funcs.updateVenue);
  });

  describe('set_venue_status', () => {
    const args = { venue_id: sv('v1'), venue_status: sv({ status: 'AVAILABLE' }) };

    it('rejects when venue is IN_USE', async () => {
      node_funcs.getVenueStatus.mockResolvedValue({ status: 'IN_USE' });
      const res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/in use/);
      expect(node_funcs.updateVenueStatus).not.toHaveBeenCalled();
    });

    it('returns http-code error when getVenueStatus fails', async () => {
      node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 404 });
      node_funcs.getVenueStatus.mockRejectedValueOnce(new Error('x'));
      let res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(res.statusCode).toBe(404);

      node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 0 });
      node_funcs.getVenueStatus.mockRejectedValueOnce(new Error('x'));
      res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(res.statusCode).toBe(400);
    });

    it('updates status when not in use', async () => {
      node_funcs.getVenueStatus.mockResolvedValue({ status: 'AVAILABLE' });
      node_funcs.updateVenueStatus.mockResolvedValue();
      const res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(node_funcs.updateVenueStatus).toHaveBeenCalledWith('v1', { status: 'AVAILABLE' }, 'AUTHKEY');
      expect(res.statusCode).toBe(204);
    });

    it('returns http-code error when updateVenueStatus fails', async () => {
      node_funcs.getVenueStatus.mockResolvedValue({ status: 'AVAILABLE' });
      node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 500 });
      node_funcs.updateVenueStatus.mockRejectedValueOnce(new Error('x'));
      let res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(res.statusCode).toBe(500);

      node_funcs.getVenueStatus.mockResolvedValue({ status: 'AVAILABLE' });
      node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 0 });
      node_funcs.updateVenueStatus.mockRejectedValueOnce(new Error('x'));
      res = createRes();
      await Venue.set_venue_status(args, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('VenueGroupService', () => {
  it('create_venue_group: success + error(400)', async () => {
    node_funcs.createVenueGroup.mockResolvedValue({ id: 'g1' });
    const res = createRes();
    await VenueGroup.create_venue_group({ venue_group: sv({ n: 1 }) }, res, noop, H);
    expect(node_funcs.createVenueGroup).toHaveBeenCalledWith({ n: 1 }, 'AUTHKEY');
    expect(res.body).toEqual({ id: 'g1' });

    node_funcs.createVenueGroup.mockRejectedValue(new Error('x'));
    const res2 = createRes();
    await VenueGroup.create_venue_group({ venue_group: sv({}) }, res2, noop, H);
    expect(res2.statusCode).toBe(400);
  });

  it('get_venue_group: success + http-code error', async () => {
    node_funcs.getVenueGroup.mockResolvedValue({ id: 'g1' });
    const res = createRes();
    await VenueGroup.get_venue_group({ venue_group_id: sv('g1') }, res, noop, H);
    expect(node_funcs.getVenueGroup).toHaveBeenCalledWith('g1', 'AUTHKEY');
    await expectHttpCodeError(VenueGroup.get_venue_group, { venue_group_id: sv('g1') }, node_funcs.getVenueGroup);
  });

  it('get_venue_groups: all params + none + http-code error', async () => {
    node_funcs.getVenueGroups.mockResolvedValue({ venue_groups: [1], total_count: 1 });
    let res = createRes();
    await VenueGroup.get_venue_groups({
      description: sv('d'), status: sv('ACTIVE'), offset: sv(0), limit: sv(10), sort: sv('ASC'), venue_group_name: sv('g')
    }, res, noop, H);
    expect(node_funcs.getVenueGroups).toHaveBeenCalledWith({
      description: 'd', status: 'ACTIVE', offset: 0, limit: 10, sort: 'ASC', venue_group_name: 'g'
    }, 'AUTHKEY');
    expect(res.headers['x-total-count']).toBe(1);

    node_funcs.getVenueGroups.mockResolvedValue({ venue_groups: [], total_count: 0 });
    res = createRes();
    await VenueGroup.get_venue_groups({}, res, noop, H);
    expect(node_funcs.getVenueGroups).toHaveBeenCalledWith({}, 'AUTHKEY');

    await expectHttpCodeError(VenueGroup.get_venue_groups, {}, node_funcs.getVenueGroups);
  });

  it('update_venue_group: 204 + http-code error', async () => {
    node_funcs.updateVenueGroup.mockResolvedValue();
    const res = createRes();
    await VenueGroup.update_venue_group({ venue_group_id: sv('g1'), venue_group: sv({ n: 1 }) }, res, noop, H);
    expect(node_funcs.updateVenueGroup).toHaveBeenCalledWith('g1', { n: 1 }, 'AUTHKEY');
    expect(res.statusCode).toBe(204);
    await expectHttpCodeError(VenueGroup.update_venue_group, { venue_group_id: sv('g1'), venue_group: sv({}) }, node_funcs.updateVenueGroup);
  });
});
