import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelDashboard } from './level-dashboard';

describe('LevelDashboard', () => {
  let component: LevelDashboard;
  let fixture: ComponentFixture<LevelDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
