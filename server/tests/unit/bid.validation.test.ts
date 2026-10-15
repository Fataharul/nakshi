
describe('T-049 Bid Submission — boundary values', () => {
  it('accepts a bid exactly equal to the starting bid when there are no bids', () => {
    const min = getMinimumAcceptableBid(500, null);
    const amount = 500;
    expect(min.inclusive && amount >= min.amount).toBe(true);
  });

  it('rejects a bid exactly equal to the current highest bid', () => {
    const min = getMinimumAcceptableBid(500, 700);
    const amount = 700;
    expect(!min.inclusive && amount > min.amount).toBe(false);
  });
});