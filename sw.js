self.addEventListener('install', function(event) {
	self.skipWaiting();
	self.password = ""
});

self.addEventListener('activate', function(event) {
	console.log(' now ready to handle fetches!');
	return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
	console.log("HERE", event.request)
	const url = new URL(event.request.url)
	console.log("url", url)
	if(url.pathname == "/sw/pw_get") {
		event.respondWith(new Response(self.password))
	} else if(url.pathname == "/sw/pw_set") {
		self.password = url.search.slice(1) //skip the first '?'
		event.respondWith(new Response('OK'))
	} else if(url.pathname == "/sw/ping") {
		event.respondWith(new Response('pong'))
	} else {
		event.respondWith(fetch(event.request))
	}
});
