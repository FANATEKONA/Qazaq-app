import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shadowing } from './shadowing';

describe('Shadowing', () => {
  let component: Shadowing;
  let fixture: ComponentFixture<Shadowing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shadowing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shadowing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
