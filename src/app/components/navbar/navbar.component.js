import { Component } from '@angular/core';
import { ConfigurationService } from './../../services/configuration.service';
import { MaterializeService } from './../../services/materialize.service';
import { AuthService } from './../../services/auth.service';
import template from './navbar.tpl.html';

@Component({
  selector: 'navbar',
  template: template
})

export class NavbarComponent {
  constructor(configurationService: ConfigurationService,
              authService: AuthService,
              materializeService: MaterializeService) {
    this.configuration = configurationService;
    this.authService = authService;
    this.materialize = materializeService;
  }

  ngOnInit() {
    this.materialize.updateTooltips();
  }

  isUserAuthenticated() {
    return this.authService.isUserAuthenticated();
  }

  getUser() {
    return this.configuration.user;
  }
}
