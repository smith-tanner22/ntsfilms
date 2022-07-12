const copyrightyear = document.getElementById('currentdate');
copyrightyear.textContent = new Date().getFullYear();

var lastmodified = document.getElementById('lastmodified');
lastmodified.textContent = new Date(document.lastModified);
