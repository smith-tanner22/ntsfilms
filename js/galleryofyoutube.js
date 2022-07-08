// const $ = require('jquery')(window);
console.log('script is working');
$(document).delegate('*[data-toggle="lightbox"]', 'click', function (event) {
  console.log('clicked');
  event.preventDefault();
  $(this).ekkoLightbox();
});
