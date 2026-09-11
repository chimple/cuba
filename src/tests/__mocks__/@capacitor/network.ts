export const Network = {
  getStatus: jest.fn().mockResolvedValue({
    connected: false,
    connectionType: 'none',
  }),
};
