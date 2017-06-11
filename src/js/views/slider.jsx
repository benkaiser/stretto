import { h, Component } from 'preact';
import BootstrapSlider from 'bootstrap-slider';
import Player from '../services/player';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

const SCRUB_DELAY = 1000;

class Slider extends Component {
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
    setInterval(() => {
      if (this.sliding) return;
      Player.currentTime().then((currentTime) => {
        this.slider.setValue(currentTime, false, false);
      })
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

  @autobind
  _getTime(value) {
    return Utilities.timeFormat(~~(Player.duration() * value));
  }
}

module.exports = Slider;
