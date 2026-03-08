import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosticTest } from './diagnostic-test';

describe('DiagnosticTest', () => {
  let component: DiagnosticTest;
  let fixture: ComponentFixture<DiagnosticTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosticTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
