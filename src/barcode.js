import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Svg, { Rect } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';

/**
 * A simple component for displaying Barcode Code using svg
 */
export default class Barcode extends PureComponent {
  static propTypes = {
    /* what the barCode stands for */
    value: PropTypes.string,
    /* Select which barcode type to use */
    format: PropTypes.oneOf(Object.keys(barcodes)),
    /* Overide the text that is diplayed */
    text: PropTypes.string,
    /* The width option is the width of a single bar. */
    width: PropTypes.number,
    /* The height of the barcode. */
    height: PropTypes.number,
    /* Set the color of the bars */
    lineColor: PropTypes.string,
    /* Set the color of the text. */
    textColor: PropTypes.string,
    /* Set the background of the barcode. */
    background: PropTypes.string,
    /* Handle error for invalid barcode of selected format */
    onError: PropTypes.func
  };

  static defaultProps = {
    value: undefined,
    format: 'CODE128',
    text: undefined,
    width: 1,
    height: 100,
    lineColor: '#000000',
    textColor: '#000000',
    background: '#ffffff',
    onError: undefined
  };

  constructor(props) {
    super(props);
    this.state = {
      bars: [],
      barCodeWidth: 0
    };
  }

  componentWillUpdate(nextProps) {
    // if value has changed, re-setMatrix
    if (nextProps.value !== this.props.value) {
      this.update(nextProps);
    }
  }

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  /* Update data of Barcode and rerender */
  update() {
    const encoder = barcodes[this.props.format];
    const encoded = this.encode(this.props.value, encoder, this.props);

    if (encoded) {
      const encodedBytes = this.getEncodedBytes(encoded);
      this.state.bars = this.genSvgRectData(encodedBytes, this.props);
      this.state.barCodeWidth = encodedBytes.length * this.props.width;
    }
  }

  // encode() handles the Encoder call and builds the binary string to be rendered
  encode(text, Encoder, options) {
    // Ensure that text is a string
    text = '' + text;

    var encoder;

    try {
      encoder = new Encoder(text, options);
    } catch (error) {
      // If the encoder could not be instantiated, throw error.
      if (this.props.onError) {
        this.props.onError(new Error('Invalid barcode format.'));
        return;
      } else {
        throw new Error('Invalid barcode format.');
      }
    }

    // If the input is not valid for the encoder, throw error.
    if (!encoder.valid()) {
      if (this.props.onError) {
        this.props.onError(new Error('Invalid barcode for selected format.'));
        return;
      } else {
        throw new Error('Invalid barcode for selected format.');
      }
    }

    // Make a request for the binary data (and other infromation) that should be rendered
    // encoded stucture is {
    //  text: 'xxxxx',
    //  data: '110100100001....'
    // }
    var encoded = encoder.encode();

    return encoded;
  }

  getEncodedBytes(encoded) {
    if (Array.isArray(encoded)) {
      let data = '';
      for (const item of encoded) {
        data = `${data}${item.data}`;
      }
      return data;
    } else {
      if (encoded.data) {
        return encoded.data;
      }
    }
  }

  genSvgRectData(encodedBytes, options = {}) {
    let data = [];
    let barWidth = 0;
    for (let b = 0; b < encodedBytes.length; b++) {
      if (encodedBytes[b] === '1') {
        barWidth++;
      } else if (barWidth > 0) {
        data.push({
          x: (b - barWidth) * options.width,
          y: 0,
          w: options.width * barWidth,
          h: options.height
        });
        barWidth = 0;
      }
    }

    // Last draw is needed since the barcode ends with 1
    if (barWidth > 0) {
      data.push({
        x: (encodedBytes.length - barWidth) * options.width,
        y: 0,
        w: options.width * barWidth,
        h: options.height
      });
    }
    return data;
  }

  render() {
    this.update();
    const width = this.state.barCodeWidth;
    const height = this.props.height;

    return (
      <Svg width={width} height={height}>
        {this.state.bars.map(e => {
          return (
            <Rect
              key={e.id}
              x={e.x}
              y={e.y}
              width={e.w}
              height={e.h}
              fill="black"
            />
          );
        })}
      </Svg>
    );
  }
}
