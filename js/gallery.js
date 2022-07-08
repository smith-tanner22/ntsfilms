var videoPlayer = document.getElementById('videoPlayer');
var myVideo = document.getElementById('myVideo');

function stopVideo() {
  videoPlayer.style.display = 'none';
}

function playVideo() {
  console.log('clicked');
  videoPlayer.style.display = 'block';
}

$(document).ready(function () {
  $('#play-video').on('click', function (ev) {
    $('#video')[0].src += '&autoplay=1';
    ev.preventDefault();
  });
});
