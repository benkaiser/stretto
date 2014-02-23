var element = null;
var padding_factor = 100;
function CoverBox(url){
  this.url = url;
  this.activate = function(){
    var imgCSS = "position: fixed; z-index: 1031; border-radius: 20px; box-shadow: #333 0px 0px 30px 5px;"; 
    $(document.body).append("<div class='modal-backdrop fade in'></div>");
    $(".modal-backdrop").click(this.deactivate);
    element = $("<img class='modal-picture' style='" + imgCSS + "' src='" + this.url + "' />");
    element.on('load', function(){
      var docW = $(window).width();
      var docH = $(window).height();
      // work out the maximum height (smaller out of width and height)
      var maxw = docW - padding_factor;
      var maxh = docH - padding_factor;
      var max_size = (maxw > maxh) ? maxh : maxw;
      // calculate the width and height to use
      var imgW = (this.width < max_size) ? this.width : max_size;
      var imgH = (this.height < max_size) ? this.height : max_size;
      element.css({
        "left": ((docW/2) - (imgW/2)) + "px",
        "top": ((docH/2) - (imgH/2)) + "px",
        "max-width:": imgW + "px",
        "max-height": imgH + "px"
      });
      $(document.body).append(element);
    });
  }
  this.deactivate = function(){
    $(".modal-backdrop").remove();
    $(".modal-picture").remove();
  }
}