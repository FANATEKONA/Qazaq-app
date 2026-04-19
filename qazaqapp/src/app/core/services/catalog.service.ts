import { Injectable, signal } from '@angular/core';

import { learningCatalog } from '../../shared/content-catalog';
import { LearningCatalog } from '../../shared/models/content';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly catalog = signal<LearningCatalog | null>(null);
  readonly loading = signal(false);

  async ensureLoaded(force = false): Promise<LearningCatalog> {
    if (this.catalog() && !force) {
      return this.catalog() as LearningCatalog;
    }

    this.loading.set(true);
    try {
      this.catalog.set(learningCatalog);
      return learningCatalog;
    } finally {
      this.loading.set(false);
    }
  }
}
