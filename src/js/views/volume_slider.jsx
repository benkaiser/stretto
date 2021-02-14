import * as React from 'react';
import BootstrapSlider from 'bootstrap-slider';
import Player from '../services/player';

const SCRUB_DELAY = 1000;

export default class VolumeSlider extends React.Component {
  constructor(props) {
    super(props);
    this.sliding = false;
  }

  componentDidMount() {
    this.slider = new BootstrapSlider(this.sliderElement, {
      max: 100,
      min: 0,
      step: 1,
      tooltip: 'show',
      value: Player.volume * 100
    }).on('slideStart', this.slideStart.bind(this))
      .on('slide', this.slide.bind(this))
      .on('slideStop', this.slideStop.bind(this));
  }

  componentWillUnmount() {
    this.disposed = true;
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

  commitSlide() {
    Player.setVolume(this.scrubPosition);
  }

  slide(slideValue) {
    this.scrubPosition = slideValue;
    if (this.scrub_timeout) clearTimeout(this.scrub_timeout);
    this.scrub_timeout = setTimeout(this.commitSlide.bind(this), SCRUB_DELAY);
  }

  slideStart(slideValue) {
    this.scrubPosition = slideValue;
    this.sliding = true;
  }

  slideStop(slideValue) {
    this.scrubPosition = slideValue;
    this.sliding = false;
    if (this.scrub_timeout) clearTimeout(this.scrub_timeout);
    this.commitSlide();
  }
}