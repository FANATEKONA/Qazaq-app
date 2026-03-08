import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleTest } from './module-test';

describe('ModuleTest', () => {
  let component: ModuleTest;
  let fixture: ComponentFixture<ModuleTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
