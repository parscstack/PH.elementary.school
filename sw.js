// sw.js - Service Worker برای PWA

const CACHE_NAME = 'portfolio-cache-v3';
const OFFLINE_URL = 'offline.html';

// فایل‌هایی که باید کش شوند
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/student-dashboard-v2.html',
  '/portfolio-student-v3.html',
  '/smart-goals-v3.html',
  '/monthly-evaluation-v3.html',
  '/teacher-dashboard-v3.html',
  '/parent-portal.html',
  '/portfolio-core.html',
  '/admin-dashboard.html',
  '/ai-dashboard.html',
  '/leaderboard.html',
  '/library.html',
  '/reports-dashboard.html',
  '/password-manager.html',
  '/student-auth.js',
  '/teacher-auth.js',
  '/admin-auth.js',
  '/rewards-system.js',
  '/notification-system.js',
  '/ai-analytics.js',
  '/social-features.js',
  '/report-system.js',
  '/theme-manager.js',
  '/dark-mode.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'
];

// ============================================
// INSTALL - کش کردن فایل‌ها
// ============================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Installing...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete!');
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE - پاک کردن کش‌های قدیمی
// ============================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker: Activation complete!');
      return self.clients.claim();
    })
  );
});

// ============================================
// FETCH - پاسخ به درخواست‌ها
// ============================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش بود، برگردان
        if (response) {
          return response;
        }
        
        // اگر نه، از شبکه بگیر
        return fetch(event.request)
          .then(response => {
            // اگر پاسخ معتبر نبود، برگردان
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // پاسخ را در کش ذخیره کن
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // اگر نت‌نت و کش هم نبود، صفحه آفلاین را نشون بده
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'یادآوری جدید برای شما!',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: '📂 باز کردن'
      },
      {
        action: 'close',
        title: '❌ بستن'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 سامانه پوشه کار', options)
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

console.log('📱 Service Worker: Loaded successfully!');