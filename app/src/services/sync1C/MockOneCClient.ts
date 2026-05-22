import type { OneCAction, OneCClient, OneCMembershipDTO, OneCPaymentDTO, OneCStaffDTO, OneCUserDTO } from './types';

export class MockOneCClient implements OneCClient {
  private online = true;
  private acceptedActionIds = new Set<string>();

  setOnline(online: boolean) {
    this.online = online;
  }

  private delay(ms = 600): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async isOnline(): Promise<boolean> {
    await this.delay(120);
    return this.online;
  }

  async pushAction(actionId: string, _action: OneCAction): Promise<void> {
    await this.delay(250);
    if (!this.online) {
      throw new Error('Mock 1C service is offline');
    }
    this.acceptedActionIds.add(actionId);
  }

  async fetchUsers(_since?: string): Promise<OneCUserDTO[]> {
    await this.delay();
    if (!this.online) {
      throw new Error('Mock 1C service is offline');
    }
    return [];
  }

  async fetchMemberships(_since?: string): Promise<OneCMembershipDTO[]> {
    await this.delay();
    if (!this.online) {
      throw new Error('Mock 1C service is offline');
    }
    return [];
  }

  async fetchPayments(_since?: string): Promise<OneCPaymentDTO[]> {
    await this.delay();
    if (!this.online) {
      throw new Error('Mock 1C service is offline');
    }
    return [];
  }

  async fetchStaff(): Promise<OneCStaffDTO[]> {
    await this.delay();
    if (!this.online) {
      throw new Error('Mock 1C service is offline');
    }
    return [];
  }
}
