import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { RUNTIME_CONFIG, loadRuntimeConfig } from './app/auth/runtime-config';

loadRuntimeConfig()
  .then((runtimeConfig) =>
    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [...appConfig.providers, { provide: RUNTIME_CONFIG, useValue: runtimeConfig }],
    }),
  )
  .catch((err) => console.error(err));
