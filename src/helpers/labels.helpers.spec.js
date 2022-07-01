import { describe, it, expect } from 'vitest';
import { mapLabelNames } from './labels.helpers';

describe('LabelsHelpers spec', () => {
  describe('When LabelsNames should be mapped to Labels', () => {
    const labels = [
      { name: 'MongoDb', color: 'red' },
      { name: 'Linux', color: 'yellow' },
    ];

    const labelNames = ['Linux', 'Git'];

    const expectedLabels = [
      { name: 'Linux', color: 'yellow' },
      { name: 'Git', color: '000000' },
    ];

    it('Should return the expectedLabels', () => {
      expect(mapLabelNames(labels, labelNames)).toStrictEqual(expectedLabels);
    });
  });
});
