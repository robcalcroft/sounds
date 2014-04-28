// Change pause and play buttons

var app = {

	playButtonText : "<i class=\"fa fa-play\"></i>",
	pauseButtonText : "<i class=\"fa fa-pause\"></i>",
	loadingButtonText: "<i class=\"fa fa-refresh fa-spin\"></i>",

	trackStatus : 'playing',
	currentSong : null,
	trackManager : null,

	clientID : null,

	playlist : null,
	playlistTrackNo : null,

	firstLoad : true,

	playPauseInit : function() {

		$('div.track-control #play-pause').click(function() {

			app.playPauseToggle();
		
		})

	},

	keyPressActions : function() {

		$('html').keydown(function(e) {

			if(e.which == 32) { e.preventDefault(); app.playPauseToggle() }

			else if(e.which == 37) { e.preventDefault(); app.changeTrack('previous') }

			else if(e.which == 39) { e.preventDefault(); app.changeTrack('next'); }

		})

	},

	playPauseToggle : function() {

		if(app.trackStatus == "playing") {

				//$('#play-pause').html(app.playButtonText);
				$('#play-pause').removeClass('fa fa-pause').addClass('fa fa-play');
				app.trackStatus = 'paused';
				app.trackManager.pause();


			} else {

				//$('#play-pause').html(app.pauseButtonText);
				$('#play-pause').removeClass('fa fa-play').addClass('fa fa-pause');
				app.trackStatus = 'playing';
				app.trackManager.play();
				app.scrubberControl();

			}

	},

	trackControlInit : function() {

		$('div.side-controls-next-track').click(function() {

			app.changeTrack('next');

		})

		$('div.side-controls-previous-track').click(function() {

			app.changeTrack('previous');

		})

	},

	changeTrack : function(direction) {

		var trackN = parseInt(app.playlistTrackNo);

		if(direction == 'next') {

			if(trackN + 1 == app.playlist.tracks.length) {

				trackN = 0; app.playlistTrackNo = 0;

				app.playSong(app.playlistTrackNo);

			} else {

				app.playSong(trackN + 1);

			}

		} else if(direction == 'previous') {

			if(trackN - 1 < 0) {

				trackN = app.playlist.tracks.length - 1;

				app.playSong(trackN);

			} else {

				app.playSong(trackN - 1);

			}
		}

	}, 

	oops : function(type) {
		if(type == 'empty') {
			$('#track-title').html("This playlist is empty"); $('div.track-data').hide(); $('#track-artwork-src').attr('src', 'http://i.imgur.com/s7bJhl9.jpg'); app.trackManager.stop(); localStorage.clear();
		} else {
			$('#track-title').html("I couldn't find that! <br>Does the playlist exist? <span style='text-decoration: underline;' onclick='window.location.reload();'>Reload?</span>"); $('#track-artwork-src').attr('src', 'http://i.imgur.com/mhrgNWX.jpg'); $('div.track-data').hide(); app.trackManager.stop(); localStorage.clear();
		}
	},

	loadSong : function() {

			var track = {}

			if(!app.firstLoad) {

				track.url = $('#user-playlist').val()

				localStorage.setItem('user-playlist', track.url);

			} else if(app.firstLoad && localStorage.getItem('user-playlist')) {

				track.url = localStorage.getItem('user-playlist');

				app.firstLoad = false;

			} else {

				track.url = 'https://soundcloud.com/robcalcroft/sets/robs-tracks';

				app.firstLoad = false;

			}

			// Init soundcloud API
			SC.initialize({
  				client_id: 'YOUR CLIENT ID'
			});

			$.getJSON('https://api.sndcdn.com/resolve?url=' + track.url + '&_status_code_map%5B302%5D=200&_status_format=json&client_id=09b931a2e2114455aee177aa73749b1d', function(_playlist) {

				SC.get(_playlist.location, function(playlist, error) { 
				
					console.log(error);

					if(error) { app.oops(); return false }

					if(playlist.tracks.length == 0) { app.oops('empty'); return false } 

					app.playlist = playlist;

					if(localStorage.getItem('user-playlist-currentTrack')) {

						app.playSong(localStorage.getItem('user-playlist-currentTrack'))

					} else if(!localStorage.getItem('user-playlist-currentTrack')) {

						app.playSong(0);

					} else {
						// Play a random song from my playlist
						var t = (function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; })(0, app.playlist.track_count - 1)
						app.playSong(t);
					}

					// Gives the track time to load
					app.playPauseInit();
					app.trackControlInit();
					app.keyPressActions();


				});

			}).fail(app.oops)

	
	},

	playSong : function(trackNo) {

		if(app.trackStatus == 'paused') {

			app.trackStatus = 'playing';
			$('#play-pause').removeClass('fa fa-play').addClass('fa fa-pause');

		}

		app.currentSong = app.playlist.tracks[trackNo];

		app.playlistTrackNo = trackNo;

		if(localStorage.getItem('user-playlist')) { 
			localStorage.removeItem('user-playlist-currentTrack');
			localStorage.setItem('user-playlist-currentTrack', app.playlistTrackNo) 
		}

		try { app.trackManager.stop() } catch(e) { console.log('No song to stop') }

		SC.stream(app.currentSong.uri, function(sound, error) {
			if(error) { app.oops(); return false }
			sound._ondataerror = function() { app.oops(); alert('broke') }
			app.trackManager = sound;
			sound.play();
			app.scrubberStart();

			//sound.mute(); // use while dev'ing
			sound._onfinish = function() { app.changeTrack('next') }
		});

		// Tab title
		document.title = 'Now Playing - ' + app.currentSong.title + '   ';

		// Track
		$('#track-title').html(app.currentSong.title);

		$('div.track-data').show()
		// Artist
		$('#track-artist').html(app.currentSong.user.username);
		// Album
		$('#track-album').html(app.playlist.title);
		// Artwork
		try { $('#track-artwork-src').attr("src", app.currentSong.artwork_url.replace('large.jpg', 't500x500.jpg')); } catch(e) {}

	},

	overlayControl : function() {

		$('footer #footer-1').click(function() {
			$('div#o1').fadeIn();
		})

		$('div.overlay-close span').click(function() {
			$('div#o1, div#o2').fadeOut();
		})

		$('div#custom-playlist').click(function() {
			$('div#o2').fadeIn();
		})

		$('#load-playlist').click(function() { 

			var playlistURLRegex = /(https|http):\/\/soundcloud.com/, userPlaylist = $('#user-playlist').val(), 

			hideBoth = function() { $('#error-empty, #error-no-link').hide() };

			if(!playlistURLRegex.test(userPlaylist)) { hideBoth(); $('#error-no-link').fadeIn('quick', function() { return false; }) }

			else { 

				hideBoth(); 

				app.loadSong(); 

				$('div#o2').fadeOut();

				if(localStorage.getItem('user-playlist')) { 

					localStorage.removeItem('user-playlist-currentTrack');

				}

			}


		})

		$('#site-data-rm').click(function() {

			if(localStorage.length == 0) {

				$('#site-data-rm span').fadeOut(function() {

					$(this).html('No site data to remove :¬(').fadeIn().delay(2000).fadeOut(function() {

						$(this).html('Remove Site Data').fadeIn();

					})	
				})

			} else {

				localStorage.clear();

				$('#site-data-rm span').fadeOut(function() {

					$(this).html('All done :¬)').fadeIn().delay(2000).fadeOut(function() {

						$(this).html('Remove Site Data').fadeIn();

					})	
				})
			}
		})

	},

	scrubberStart : function() {

		setInterval(function() {

			var pos = app.trackManager.position, dur = app.trackManager.duration, percentage;

			percentage = (pos/dur) * 100;

			percentage = Math.round(percentage);

			//console.log(Math.round(percentage))

			$('div.scrubber-slider').css('width', percentage + '%');

		},500)
			
	}
		

}

$(document).ready(function() {
	app.loadSong();
	app.overlayControl();
	try { app.playlistTrackNo = localStorage.getItem('user-playlist-currentTrack') } catch(e) {}
});

function echo(text) { console.log(text) }