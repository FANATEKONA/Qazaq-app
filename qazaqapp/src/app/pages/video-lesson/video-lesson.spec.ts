import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoLesson } from './video-lesson';

describe('VideoLesson', () => {
  let component: VideoLesson;
  let fixture: ComponentFixture<VideoLesson>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoLesson]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoLesson);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
