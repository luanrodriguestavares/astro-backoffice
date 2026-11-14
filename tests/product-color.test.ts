import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
    defaultProductColor,
    ProductColorPicker,
    productColorPresets,
    productColorStyle,
} from '../src/components/products/product-color';

describe('product color', () => {
    it('offers only the nine main colors and defaults to blue', () => {
        assert.equal(productColorPresets.length, 9);
        assert.equal(defaultProductColor, '#2563eb');
        assert.ok(productColorPresets.some((preset) => preset.value === defaultProductColor));
    });

    it('always uses a white icon, including on light colors', () => {
        assert.equal(productColorStyle('#101214').color, '#ffffff');
        assert.equal(productColorStyle('#2563eb').color, '#ffffff');
        assert.equal(productColorStyle('#facc15').color, '#ffffff');
        assert.equal(productColorStyle('#ffffff').color, '#ffffff');
        assert.equal(productColorStyle(null).color, '#ffffff');
        assert.equal(productColorStyle(null).background, defaultProductColor);
    });

    it('uses the product color as a solid background without a dark border', () => {
        assert.deepEqual(productColorStyle('#2563eb'), {
            color: '#ffffff',
            background: '#2563eb',
            borderColor: 'transparent',
            boxShadow: '0 7px 20px color-mix(in srgb, #2563eb 22%, transparent)',
        });
    });

    it('renders only presets, without no-color or custom-color controls', () => {
        const markup = renderToStaticMarkup(
            createElement(ProductColorPicker, {
                value: defaultProductColor,
                icon: 'bolt',
                onChange() {},
            }),
        );

        assert.doesNotMatch(markup, /Sem cor/i);
        assert.doesNotMatch(markup, /type="color"/i);
        assert.doesNotMatch(markup, /Cor em hexadecimal/i);
        assert.equal(markup.match(/role="radio"/g)?.length, 9);
    });
});
