import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment (zoneless)
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true },
});
