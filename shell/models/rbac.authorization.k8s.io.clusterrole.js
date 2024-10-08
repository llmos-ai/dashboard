import { LLMOS_MGMT_API_GROUP, SUBTYPE_MAPPING } from '@shell/models/management.llmos.ai.globalrole';
import { uniq } from '@shell/utils/array';
import Role from './rbac.authorization.k8s.io.role';

export default class ClusterRole extends Role {
  get subtype() {
    return SUBTYPE_MAPPING.RBAC_CLUSTER_ROLE.key;
  }

  get namespaceResources() {
    return this.allResources.filter((r) => r.attributes.namespaced && !r.attributes.group.includes(LLMOS_MGMT_API_GROUP));
  }

  get resources() {
    return uniq(this.namespaceResources.map((r) => r.attributes?.kind)).sort();
  }
}
