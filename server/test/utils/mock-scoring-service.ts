export class MockScoringService {
  async awardPoints(userId: string, points: number): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }
}
