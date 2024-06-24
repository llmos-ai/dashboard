const clusterNameSegments = /([A-Za-z]+|\d+)/g;

/**
 * Shortens an input string based on the number of segments it contains.
 * @param {string} input - The input string to be shortened.
 * @returns {string} - The shortened string.
 * @example smallIdentifier('local') => 'lcl'
 * @example smallIdentifier('word-wide-web') => 'www'
 */
export function abbreviateClusterName(input) {
  if (!input) {
    return '';
  }

  if (input.length <= 3) {
    return input;
  }

  const segments = input.match(clusterNameSegments);

  if (!segments) return ''; // In case no valid segments are found

  let result = '';

  switch (segments.length) {
  case 1: {
    const word = segments[0];

    result = `${ word[0] }${ word[Math.floor(word.length / 2)] }${ word[word.length - 1] }`;
    break;
  }
  case 2: {
    const w1 = `${ segments[0][0] }`;
    const w2 = `${ segments[0].length >= 2 ? segments[0][segments[0].length - 1] : segments[1][0] }`;
    const w3 = `${ segments[1][segments[1].length - 1] }`;

    result = w1 + w2 + w3;
    break;
  }
  default:
    result = segments.slice(0, 3).map((segment) => segment[0]).join('');
  }

  return result;
}
