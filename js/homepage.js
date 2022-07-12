let t;
let lastScrollTop = 0;
let startScroll = 0;
let scrollDirection;

function checkScroll() {
  startScroll = (
    ((t = document.documentElement) || (t = document.body.parentNode)) &&
    typeof t.scrollTop == 'number'
      ? t
      : document.body
  ).scrollTop;
  //startScroll = window.scrollY;

  if (startScroll > lastScrollTop) {
    scrollDirection = 'down';
  } else if (startScroll == lastScrollTop) {
    //do nothing
    //In IE this is an important condition because there seems to be some instances where the last scrollTop is equal to the new one
  } else {
    scrollDirection = 'up';
  }

  lastScrollTop = startScroll;
  return scrollDirection;
}

let getContentRec = document.querySelectorAll('.content');
function getOverlapContent(intersecPosition) {
  for (let i = 0; i < getContentRec.length; i++) {
    let contentEndPos =
      (Math.floor(getContentRec[i].getBoundingClientRect().height) -
        intersecPosition) *
      -1;
    let contentListRec = Math.floor(
      getContentRec[i].getBoundingClientRect().top
    );

    //console.log(i, contentListRec, intersecPosition, contentEndPos);
    if (contentListRec <= intersecPosition && contentListRec >= contentEndPos) {
      return getContentRec[i];
    }
  }
}

let dataItem;
let getScrollTop = 0;
let newPoint = 100;

function updateScroll() {
  // GET SCROLL DIRECTION FIRST
  checkScroll();

  let floatingElm = document.querySelector('#floating-vdo');
  let floatingElmRec = floatingElm.getBoundingClientRect();
  let intersecPos = Math.floor(floatingElmRec.height) + floatingElmRec.top;

  if (getOverlapContent(intersecPos)) {
    newPoint = Math.round(
      ((getOverlapContent(intersecPos).getBoundingClientRect().top -
        floatingElmRec.top) /
        floatingElmRec.height) *
        100
    );
    dataItem = getOverlapContent(intersecPos).getAttribute('data-item');

    newPoint = newPoint < 0 ? 0 : newPoint;

    if (dataItem == 1) {
      document
        .querySelector('#vdo-1')
        .style.setProperty('--item1-left-point', '0%');
      document
        .querySelector('#vdo-1')
        .style.setProperty('--item1-right-point', '0%');
    } else {
      document
        .querySelector('#vdo-' + dataItem)
        .style.setProperty('--item' + dataItem + '-left-point', newPoint + '%');
      document
        .querySelector('#vdo-' + dataItem)
        .style.setProperty(
          '--item' + dataItem + '-right-point',
          newPoint + '%'
        );
    }

    let getLeftPoint = parseInt(
      getComputedStyle(
        document.querySelector('#vdo-' + dataItem)
      ).getPropertyValue('--item' + dataItem + '-left-point')
    );
    if (dataItem > 1 && getLeftPoint > 0) {
      document
        .querySelector('#vdo-' + parseInt(dataItem - 1))
        .style.setProperty(
          '--item' + parseInt(dataItem - 1) + '-left-point',
          '0%'
        );
      document
        .querySelector('#vdo-' + parseInt(dataItem - 1))
        .style.setProperty(
          '--item' + parseInt(dataItem - 1) + '-right-point',
          '0%'
        );
    }
  }

  let secondContent = document.querySelector('#second-content');
  if (
    scrollDirection == 'up' &&
    Math.floor(secondContent.getBoundingClientRect().top) >= intersecPos
  ) {
    document
      .querySelector('#vdo-2')
      .style.setProperty('--item2-left-point', '100%');
    document
      .querySelector('#vdo-2')
      .style.setProperty('--item2-right-point', '100%');
  }

  let thirdContent = document.querySelector('#third-content');
  if (
    scrollDirection == 'up' &&
    Math.floor(thirdContent.getBoundingClientRect().top) >= intersecPos
  ) {
    document
      .querySelector('#vdo-3')
      .style.setProperty('--item3-left-point', '100%');
    document
      .querySelector('#vdo-3')
      .style.setProperty('--item3-right-point', '100%');
  }
  let forthContent = document.querySelector('#forth-content');
  if (
    scrollDirection == 'up' &&
    Math.floor(forthContent.getBoundingClientRect().top) >= intersecPos
  ) {
    document
      .querySelector('#vdo-4')
      .style.setProperty('--item4-left-point', '100%');
    document
      .querySelector('#vdo-4')
      .style.setProperty('--item4-right-point', '100%');
  }
  let fifthContent = document.querySelector('#fifth-content');
  if (
    scrollDirection == 'up' &&
    Math.floor(fifthContent.getBoundingClientRect().top) >= intersecPos
  ) {
    document
      .querySelector('#vdo-5')
      .style.setProperty('--item5-left-point', '100%');
    document
      .querySelector('#vdo-5')
      .style.setProperty('--item5-right-point', '100%');
  }
}

document.addEventListener('scroll', updateScroll);
updateScroll();

let allVdoElm = document.querySelectorAll('.vdo');
function playPauseVdo(vdoCtrlBtn) {
  if (vdoCtrlBtn.classList.contains('-pause')) {
    vdoCtrlBtn.classList.remove('-pause');

    for (let i = 0; i < allVdoElm.length; i++) {
      allVdoElm[i].play();
    }
  } else {
    vdoCtrlBtn.classList.add('-pause');

    for (let i = 0; i < allVdoElm.length; i++) {
      allVdoElm[i].pause();
    }
  }
}

let vdoControlBtn = document.querySelector('#vdo-ctrl-btn');
vdoControlBtn.addEventListener('click', function () {
  playPauseVdo(this);
});
