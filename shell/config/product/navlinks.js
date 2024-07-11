import { DSL } from '@shell/store/type-map';

export const NAME = 'navlinks';

export function init(store) {
  DSL(store, NAME);
}
