var element = null;
function CoverBox(url){
  this.url = url;
  this.activate = function(){
    var imgCSS = "position: fixed; z-index: 1031; border-radius: 20px; box-shadow: #333 0px 0px 30px 5px;"; 
    $(document.body).append("<div class='modal-backdrop fade in'></div>");
    $(".modal-backdrop").click(this.deactivate);
    element = $("<img class='modal-picture' style='" + imgCSS + "' src='" + this.url + "' />");
    element.on('load', function(){
      docW = $(window).width();
      docH = $(window).height();
      imgW = this.width;
      imgH = this.height;
      element.css({"left": ((docW/2) - (imgW/2)) + "px","top": ((docH/2) - (imgH/2)) + "px"});
      $(document.body).append(element);
    });
  }
  this.deactivate = function(){
    $(".modal-backdrop").remove();
    $(".modal-picture").remove();
  }
}