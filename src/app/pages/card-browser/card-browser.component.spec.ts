import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardBrowserComponent } from './card-browser.component';

describe('CardBrowserComponent', () => {
  let component: CardBrowserComponent;
  let fixture: ComponentFixture<CardBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardBrowserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
