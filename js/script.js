const copyrightyear = document.getElementById('currentdate');
copyrightyear.textContent = new Date().getFullYear();

var lastmodified = document.getElementById('lastmodified');
lastmodified.textContent = new Date(document.lastModified);

const menuButton = document.querySelector('.ham');
const mainNav = document.querySelector('.navigation');

menuButton.addEventListener(
  'click',
  () => {
    console.log('button was clicked');
    mainNav.classList.toggle('responsive');
  },
  false
);

window.onresize = () => {
  if (window.innerWidth > 768) {
    console.log('window was resized');
    mainNav.classList.remove('responsive');
  }
};
