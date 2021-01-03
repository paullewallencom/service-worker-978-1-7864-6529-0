'use strict';

var CACHE_NAME = 'cache-only';
var SOURCE_URL = 'https://cdn.rawgit.com/szaranger/szaranger.github.io/master/service-workers/03/02/events';
var cacheDelayText = document.getElementById('cache-delay');
var cacheDisabledCheckbox = document.getElementById('cache-disabled-checkbox');
var cacheStatus = document.getElementById('cache-status');
var fetchButton = document.getElementById('fetch-btn');
var outlet = document.getElementById('data');
var cacheFetchStartTime;

function clear() {
  outlet.textContent = '';
  cacheStatus.textContent = '';
}

function disableEdit(enable) {
  fetchButton.disabled = enable;
  cacheDelayText.disabled = enable;
  cacheDisabledCheckbox.disabled = enable;

  if(!enable) {
    clear();
  }
}

function displayEvents(events) {

  events.forEach(function(event) {
    var tickets = event.ticket ?
      '<a href="' + event.ticket + '" class="tickets">Tickets</a>' : '';

    outlet.innerHTML = outlet.innerHTML +
      '<article>' +
      '<span class="date">' + formatDate(event.date)  + '</span>' +
      ' <span class="title">' + event.title + '</span>' +
      ' <span class="venue"> - ' + event.venue + '</span> ' +
      tickets +
      '</article>';
  });

}

function handleFetchComplete(response) {
  var cloned;

  cloned = response.clone();
  caches.open(CACHE_NAME).then(function(cache) {
    cache.put(SOURCE_URL, cloned);
  });

  response.json().then(function(data) {
    displayEvents(data);
  });
}

function handleCacheFetchComplete(result) {
  var shouldCacheError = cacheDisabledCheckbox.checked;
  if (shouldCacheError || !result) {
    throw Error('Missed cache');
  }

  result.json().then(function(data) {
      displayEvents(data);
  });
}

fetchButton.addEventListener('click', function handleClick() {
  var now = Date.now(),
   headers = new Headers();

  disableEdit(true);

  headers.append("Accept", "application/json");

  cacheStatus.textContent = 'Fetching events...';
  cacheFetchStartTime = Date.now();
  var cacheFetch = caches.open(CACHE_NAME).then(function(cache) {
    return cache.match(SOURCE_URL).then(function(response) {
      var cacheDelay = cacheDelayText.value || 0;

      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            handleCacheFetchComplete(response);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, cacheDelay);
      });
    }).then(function() {
      cacheStatus.textContent = 'Success after ' +
        getElapsedTime(cacheFetchStartTime) + 'ms';
    }).catch(function(err) {
      cacheStatus.textContent = err + ' after ' +
        getElapsedTime(cacheFetchStartTime) + 'ms';
    });
  });

  Promise.all([cacheFetch]).then(disableEdit(false));
});

function getElapsedTime(sourceFetchStartTime) {
  var now = Date.now(),
    elapsed = now - sourceFetchStartTime;

  return elapsed;
}

function formatDate(date) {
  var d = new Date(date),
      month = (d.getMonth() + 1).toString(),
      day = d.getDate().toString(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [month, day, year].join('-');
}
