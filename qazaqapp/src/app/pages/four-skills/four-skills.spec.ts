import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FourSkills } from './four-skills';

describe('FourSkills', () => {
  let component: FourSkills;
  let fixture: ComponentFixture<FourSkills>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FourSkills]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FourSkills);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
