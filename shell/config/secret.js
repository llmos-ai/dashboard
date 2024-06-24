export const SECRET_TYPES = {
  OPAQUE:           'Opaque',
  SERVICE_ACCT:     'kubernetes.io/service-account-token',
  DOCKER_JSON:      'kubernetes.io/dockerconfigjson',
  BASIC:            'kubernetes.io/basic-auth',
  SSH:              'kubernetes.io/ssh-auth',
  TLS:              'kubernetes.io/tls',
  BOOTSTRAP:        'bootstrap.kubernetes.io/token',
};
