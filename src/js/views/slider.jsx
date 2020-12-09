import * as React from 'react';
import BootstrapSlider from 'bootstrap-slider';
import Player from '../services/player';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

const SCRUB_DELAY = 1000;

export default class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.sliding = false;
  }

  componentDidMount() {
    this.slider = new BootstrapSlider(this.sliderElement, {
      formatter: this._getTime,
      max: 1,
      min: 0,
      step: 0.0001,
      tooltip: 'show',
      value: 0
    }).on('slideStart', this.slideStart.bind(this))
      .on('slide', this.slide.bind(this))
      .on('slideStop', this.slideStop.bind(this));
    this.updateTime();
    this.currentTimeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  componentWillUnmount() {
    this.disposed = true;
    this.currentTimeInterval && clearInterval(this.currentTimeInterval);
  }

  render() {
    return (
      <div className='duration-slider'>
        <div ref={ (slider) => this.sliderElement = slider } />
      </div>
    );
  }

  shouldComponentUpdate() {
    return false;
  }

  seek() {
    Player.setCurrentTime(this.scrubPosition);
  }

  slide(slideValue) {
    this.scrubPosition = slideValue;
    if (this.scrub_timeout) clearTimeout(this.scrub_timeout);
    this.scrub_timeout = setTimeout(this.seek.bind(this), SCRUB_DELAY);
  }

  slideStart(slideValue) {
    this.scrubPosition = slideValue;
    this.sliding = true;
  }

  slideStop(slideValue) {
    this.scrubPosition = slideValue;
    this.sliding = false;
    if (this.scrub_timeout) clearTimeout(this.scrub_timeout);
    this.seek();
  }

  updateTime() {
    if (this.sliding) return;
    Player.currentTime().then((currentTime) => {
      if (!this.disposed) {
        this.slider.setValue(currentTime, false, false);
      }
    });
  }

  @autobind
  _getTime(value) {
    return Utilities.timeFormat(~~(Player.duration() * value));
  }
}