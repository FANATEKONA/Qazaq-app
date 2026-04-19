import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { UserRole } from '../../shared/models/content';
import { SessionUser } from '../../shared/models/profile';
import { BackendApiService } from './backend-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly user = signal<SessionUser | null>(null);
  readonly initialized = signal(false);
  readonly loading = signal(false);

  constructor(private readonly api: BackendApiService) {}

  async loadSession(force = false): Promise<SessionUser | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.user();
    }

    if (this.initialized() && !force) {
      return this.user();
    }

    this.loading.set(true);
    try {
      const response = await this.api.getSession();
      this.user.set(response.user);
      return response.user;
    } catch {
      this.user.set(null);
      return null;
    } finally {
      this.initialized.set(true);
      this.loading.set(false);
    }
  }

  async login(payload: { email: string; password: string }): Promise<SessionUser> {
    this.loading.set(true);
    try {
      const response = await this.api.login(payload);
      this.user.set(response.user);
      this.initialized.set(true);
      return response.user;
    } finally {
      this.loading.set(false);
    }
  }

  async register(payload: { name: string; email: string; password: string; role?: UserRole; avatar?: string }): Promise<SessionUser> {
    this.loading.set(true);
    try {
      const response = await this.api.register(payload);
      this.user.set(response.user);
      this.initialized.set(true);
      return response.user;
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.user.set(null);
      return;
    }

    this.loading.set(true);
    try {
      await this.api.logout();
      this.user.set(null);
      this.initialized.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  setUser(user: SessionUser | null): void {
    this.user.set(user);
    this.initialized.set(true);
  }
}
