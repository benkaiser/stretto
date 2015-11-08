var element = null;
var padding_factor = 100;
function CoverBox(url, deactivatedCB) {
  this.url = url;
  this.activate = function() {
    var imgCSS = 'position: fixed; z-index: 1031; border-radius: 20px; box-shadow: #333 0px 0px 30px 5px;';
    $(document.body).append('<div class=\'modal-backdrop fade in\' style=\'z-index: 1030;\'></div>');
    $('.modal-backdrop').click(this.deactivate);
    element = $('<img class=\'modal-picture\' style=\'' + imgCSS + '\' src=\'' + this.url + '\' />');
    element.on('load', function() {
      var docW = $(window).width();
      var docH = $(window).height();

      // work out the maximum height (smaller out of width and height)
      var maxw = docW - padding_factor;
      var maxh = docH - padding_factor;

      // calculate the maximum ratio of available space to image height / width
      var ratio_w = maxw / this.width;
      var ratio_h = maxh / this.height;
      var max_ratio = (ratio_w > ratio_h) ? ratio_h : ratio_w;

      // calculate the width and height to use
      // if the max_ratio is greater than 1, it means we can show it at full size,
      // otherwise we must scale it down by the max_ratio
      var imgW = (max_ratio > 1) ? this.width : this.width * max_ratio;
      var imgH = (max_ratio > 1) ? this.height : this.height * max_ratio;
      element.css({
        left: ((docW / 2) - (imgW / 2)) + 'px',
        top: ((docH / 2) - (imgH / 2)) + 'px',
        'max-width:': imgW + 'px',
        'max-height': imgH + 'px',
      });
      $(document.body).append(element);
    });
  };

  this.deactivate = function() {
    $('.modal-backdrop').remove();
    $('.modal-picture').remove();
    deactivatedCB();
  };
}
