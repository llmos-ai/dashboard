import { MANAGEMENT } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class CRTB extends SteveModel {
  get principalId() {
    return this.userPrincipalId || this.groupPrincipalId;
  }

  get roleDisplay() {
    return this.roleTemplate.nameDisplay;
  }

  get roleDescription() {
    return this.roleTemplate.description;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.id);
  }
}
