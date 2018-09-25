/* eslint-env worker, serviceworker */

importScripts('./scripts/sw-toolbox.js');

const APP_CACHE_NAME = 'howcani-cache-v6';
const GITHUB_CACHE_NAME = 'github-cache';

const filesToCache = [
  './index.html',
  './images/howcani.png',
  './images/favicon/favicon-16x16.png',
  './styles/styles.css',
  './service-worker.js',
  './scripts/vendor.js',
  './scripts/bundle.js',
  './scripts/sw-toolbox.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v21/2fcrYFNaTjcS6g4U3t-Y5ZjZjT5FdEJ140U2DJYC3mY.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/js/materialize.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/fonts/roboto/Roboto-Bold.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/fonts/roboto/Roboto-Regular.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/fonts/roboto/Roboto-Light.woff2'
];

self.toolbox.options.cache.name = APP_CACHE_NAME;
self.toolbox.precache(filesToCache);
self.toolbox.router.get('/(.*)', self.toolbox.cacheFirst);

self.toolbox.router.get(/^https:\/\/api.github.com\//, self.toolbox.networkFirst, {
  cache: { name: GITHUB_CACHE_NAME }
});

