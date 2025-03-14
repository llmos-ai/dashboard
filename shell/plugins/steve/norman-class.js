import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import pickBy from 'lodash/pickBy';
import { matchesSomeRegex } from '@shell/utils/string';
import Resource from '@shell/plugins/dashboard-store/resource-class';

export default class NormanModel extends Resource {
  setLabels(val) {
    const all = this.labels || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    this['labels'] = { ...wasIgnored, ...val };
  }

  setLabel(key, val) {
    if ( val ) {
      if ( !this.labels ) {
        this.labels = {};
      }

      this.labels[key] = val;
    } else if ( this.labels ) {
      this.labels[key] = undefined;
      delete this.labels[key];
    }
  }

  setAnnotations(val) {
    const all = this.annotations || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    this['annotations'] = { ...wasIgnored, ...val };
  }

  setAnnotation(key, val) {
    if ( val ) {
      if ( !this.annotations ) {
        this.annotations = {};
      }

      this.annotations[key] = val;
    } else if ( this.annotations ) {
      this.annotations[key] = undefined;
      delete this.annotations[key];
    }
  }

  setResourceQuotas(spec) {
    const keys = ['resourceQuota', 'namespaceDefaultResourceQuota'];

    keys.forEach((key) => {
      this[key] = { ...spec[key] };
    });
  }
}
