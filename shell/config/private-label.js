import { SETTING } from './settings';

export const ANY = 0;
export const STANDARD = 1;
export const CUSTOM = 2;
export const DOCS_BASE = 'https://llmos-docs.1block.ai';

const STANDARD_VENDOR = 'LLMOS';
const STANDARD_PRODUCT = 'Dashboard';

let mode = STANDARD;
let vendor = STANDARD_VENDOR;
let product = STANDARD_PRODUCT;
let brand = null;

export function setMode(m) {
  mode = m;
}

export function setVendor(v) {
  vendor = v;
  setTitle();
}

export function setProduct(p) {
  product = p;
}

export function setBrand(b) {
  brand = b;
}

// -------------------------------------

export function getMode() {
  return mode;
}

export function getBrand() {
  return brand;
}

export function isStandard() {
  return mode === STANDARD;
}

export function matches(pl) {
  if ( pl === ANY ) {
    return true;
  }

  return pl === mode;
}

export function getVendor() {
  return vendor;
}

export function getProduct() {
  return product;
}

export function setTitle() {
  const v = getVendor();

  if (v === 'llmos') {
    const ico = require(`~shell/assets/images/pl/logo.svg`);

    document.title = 'LLMOS';
    const link = document.createElement('link');

    link.hid = 'icon';
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.hrefv = ico;
    const head = document.getElementsByTagName('head')[0];

    head.appendChild(link);
  } else {
    document.title = v;
  }
}
