import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DarkToggleComponent } from './dark-toggle.component';

describe('DarkToggleComponent', () => {
  let component: DarkToggleComponent;
  let fixture: ComponentFixture<DarkToggleComponent>;

  // Set up the testing module before each test
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarkToggleComponent] // Import component to test
    })
    .compileComponents(); // Compile component and template

    // Create component instance for testing
    fixture = TestBed.createComponent(DarkToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger initial change detection
  });

  // Test to check if component is created successfully
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
