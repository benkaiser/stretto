import { h, Component } from 'preact';
import Player from '../services/player';
import Slider from 'bootstrap-slider';

const SCRUB_DELAY = 1000;

class PlayerControls extends Component {
  constructor(props) {
    super(props);
    this.sliding = false;
  }

  componentDidMount() {
    this.slider = new Slider(this.sliderElement, {
      max: 1,
      min: 0,
      step: 0.001,
      tooltip: 'hide',
      value: 0
    }).on('slideStart', this.slideStart.bind(this))
      .on('slide', this.slide.bind(this))
      .on('slideStop', this.slideStop.bind(this));
    setInterval(() => {
      if (this.sliding) return;
      this.slider.setValue(Player.currentTime(), false, false);
    }, 1000);
  }

  render() {
    return (
      <div class='duration-slider'>
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
}

module.exports = PlayerControls;
