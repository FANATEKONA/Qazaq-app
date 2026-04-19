import { isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { CertificateView } from '../../shared/models/profile';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './certificate.html',
  styleUrl: './certificate.css',
})
export class CertificatePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  readonly profileService = inject(ProfileService);
  readonly lang = inject(LanguageService);

  readonly levelId = signal('a1');
  readonly profile = computed(() => this.profileService.profile());
  readonly certificate = computed<CertificateView | null>(() => {
    return this.profile()?.certificates.find((item) => item.levelId === this.levelId()) ?? null;
  });

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe((params) => {
      this.levelId.set(params.get('levelId') ?? 'a1');
    });
    await this.profileService.refresh(true);
  }

  printCertificate(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }
}
