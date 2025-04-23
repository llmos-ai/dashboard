import DOMPurify from 'dompurify';
import { uniq } from '@shell/utils/array';

const ALLOWED_TAGS = [
  'code',
  'li',
  'a',
  'p',
  'b',
  'br',
  'ul',
  'pre',
  'span',
  'div',
  'i',
  'em',
  'strong',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tr',
  'th',
  'tbody',
  'td',
  'blockquote',
];

let linkInterceptors = [];

// Allow 'A' tags to keep the target=_blank attribute if they have it
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (
    node.tagName === 'A' &&
    data.attrName === 'target' &&
    data.attrValue === '_blank'
  ) {
    data.forceKeepAttr = true;
  }
});

// Ensure if an 'A' tag has target=_blank that we add noopener, noreferrer and nofollow to the 'rel' attribute
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node?.target === '_blank') {
    const rel = ['noopener', 'noreferrer', 'nofollow'];
    const existingRel = node.rel?.length ? node.rel.split(' ') : [];
    const combined = uniq([...rel, ...existingRel]);

    node.setAttribute('rel', combined.join(' '));
  }
});

export const purifyHTML = (value, options = { ALLOWED_TAGS }) => {
  return DOMPurify.sanitize(value, options);
};

export function addLinkInterceptor(fn, name) {
  // Check the arg is not undefined and is a function
  if (fn && typeof fn === 'function') {
    linkInterceptors.push(fn);
  } else {
    if (name) {
      console.error(`Invalid link interceptor function for ${ name }`); // eslint-disable-line no-console
    } else {
      console.error('Invalid link interceptor function'); // eslint-disable-line no-console
    }
  }
}

export function removeLinkInterceptor(fn) {
  linkInterceptors = linkInterceptors.filter((item) => item !== fn);
}

export function processLink(link) {
  // Allow each interceptor to modify the link href
  for (let i = 0; i < linkInterceptors.length; i++) {
    const updated = linkInterceptors[i](link);

    // If a value if returned, use that in place of the original value
    if (updated) {
      link = updated;
    }
  }

  return link;
}
