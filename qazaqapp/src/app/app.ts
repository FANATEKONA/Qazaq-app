import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { CatalogService } from './core/services/catalog.service';
import { LanguageService } from './core/services/language.service';
import { ProfileService } from './core/services/profile.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly auth = inject(AuthService);
  readonly catalog = inject(CatalogService);
  readonly lang = inject(LanguageService);
  readonly profile = inject(ProfileService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly title = signal('qazaqapp');
  readonly languageOptions = [
    { id: 'ru', label: 'RU' },
    { id: 'en', label: 'EN' },
    { id: 'kz', label: 'KZ' },
  ] as const;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.catalog.ensureLoaded();
    const user = await this.auth.loadSession();
    if (user) {
      await this.profile.refresh(false);
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.profile.clear();
  }
}
