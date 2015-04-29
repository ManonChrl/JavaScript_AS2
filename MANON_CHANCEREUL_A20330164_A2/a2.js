(function (a2, $, undefined) { 
a2.movies = {};
a2.listMovie = new Array();
a2.onFullscreen = false; // Fullscreen mode disabled

a2.start = function(hookElementSelection, dataurlForJsonFile) {

	hookElementSelection.css('class','row');

	$.ajax({url:dataurlForJsonFile}).success(function(data) {
		//get the movie data
		parseJSONData(data);
		
		// insert movies in arrays listMovie if not already read by user
		$.each(a2.movies, function(i, movie) {
			if(localStorage.getItem(i)!="read"){
				a2.listMovie[a2.listMovie.length] = movie;
			}
		});
		a2.shuffleArray(a2.listMovie); // random the table of movies unread

		// insert movies already read by user at the end of listMovie array
		$.each(a2.movies, function(i, movie) {
			if(localStorage.getItem(i)=="read"){
				a2.listMovie[a2.listMovie.length] = movie;
			}
		});
		a2.render(hookElementSelection,a2.listMovie); // Render the list of movie
	});
};

a2.render = function(hookElementSelection,listMovie){
	$.each(listMovie, function(i, movie) {
		if(i==0){
			movie.renderThumbFirst(hookElementSelection,listMovie); // First thumbnail, video to play if clicked
		} else {
			movie.renderThumb(hookElementSelection,listMovie,i); // Rest of thumbnails
		}	
	});
};

var parseJSONData = function(data) {
	var movies = data;
	$.each(movies, function(i,movie) { // Parse JSON data in Movie object
		a2.movies[movie.id] = new a2.Movie(movie.id,movie.name,movie.description,movie["content-url"],movie["thumb-url"])
	});
}
a2.Movie = function(id,name,description,contentUrl,thumbUrl) {
	this.id = id;
	this.name = name;
	this.description = description;
	this.contentUrl = contentUrl;
	this.thumbUrl = thumbUrl;
	this.renderThumbFirst = function(base,listMovie) {
		var div = $("<div class='col-md-12' ></div>");
		var name = $("<div id='title'> <h1>"+ this.name + " </h1></div>");
		var thumbDisplay = $("<img id='"+this.id+"' src='" + this.thumbUrl+ "'/>");
		div.append(name);
		div.append(thumbDisplay);
		thumbDisplay.on("click",function () { // Video appears in place of thumbnail
			thumbDisplay.remove(); // thumbnail disappear
			var movieDisplay = $("<video id='videoElement'><source src='"+a2.movies[this.id].contentUrl+"' type='video/mp4'></video>");
			var videoDescription = $("<p id='videoDescription'>"+a2.movies[this.id].description+"</p>");
			var buttonPlay = $("<img id='play' src='play.png' onclick='a2.play()'/>");
			var buttonPause = $("<img id='pause' src='pause.png' onclick='a2.pause()'/>");
			var progressBar = $("<div id='progressBar'></div>");
			var timeBar = $("<div id='timeBar'></div>");
			var progressTime = $("<div id='progressTime'/>");
			var current = $("<span id='current'/>");
			var slash = $("<span id='slash'>/</span>");
			var duration = $("<span id='duration'/>");
			var fullScreen = $("<img id='fullScreen' src='fullscreen.png' onclick='a2.fullScreen()'/>");
			var defaultMode = $("<img id='defaultMode' src='defaultMode.png' onclick='a2.defaultMode()'/>");
			var alertFullscreen = $("<p id='alertFS'>Press Enter to quit fullscreen mode</p>");
			div.append(movieDisplay); 		// Video 
			div.append(videoDescription);	// Video description
			videoDescription.hide();	
			div.append(fullScreen);			// Fullscreen button
			div.append(defaultMode);		// Default mode button
			defaultMode.hide();
			div.append(alertFullscreen);	// Info to quit fullscreen
			alertFullscreen.hide();
			// Controls
			div.append(buttonPlay);
			div.append(buttonPause);
			progressBar.append(timeBar);
			div.append(progressBar);
			progressTime.append(current);
			progressTime.append(slash);
			progressTime.append(duration);
			div.append(progressTime);
			var videoPlayer = $("#videoElement");
			// When video player loaded, display the duration of the video
			videoPlayer.on('loadedmetadata', function() {
   				$('#duration').text(this.duration.toFixed(2));
			});
			// if the video played is the video whose current time has been stored (last video played by the user on the browser)
			if(this.id == localStorage.getItem('videoPlayed')){ 
				videoPlayer[0].currentTime = localStorage.getItem('currentTime'); // then go to current time stored
			}
			// Function called each time the current time of video changes
			videoPlayer.on("timeupdate", function() {
  				if(this.currentTime>=0.25*this.duration) 
					videoDescription.show();	 // Show the description of video after 25% of video elapsed
				$('#current').text(this.currentTime.toFixed(2)); // display the current time of video
				var percentage = 100 * this.currentTime / this.duration;
   				$('#timeBar').css('width', percentage+'%'); // display the time bar as a percentage of the whole time bar
   				localStorage.setItem('videoPlayed',a2.listMovie[0].id); // Store the id of video currently played
   				localStorage.setItem('currentTime',this.currentTime);	// Store the current time of video played
			});	
			var timeDrag = false; // initialize time drag status
			// Function called when the mouse pointer is on the progress bar
			$('#progressBar').mousedown(function(e) {
  				 timeDrag = true;
   				a2.updatebar(e.pageX);
			});
			// Function called when the user clicked on the progress bar
			$(document).mouseup(function(e) {
   				if(timeDrag) {
      				timeDrag = false;
      				a2.updatebar(e.pageX);
  				 }
			});
			// Function called when the mouse pointer move on the document and was clicked on the progress bar
			$(document).mousemove(function(e) {
   				if(timeDrag) {
     				 a2.updatebar(e.pageX);
   				}
			});		
		});
		base.append(div);
	};
	this.renderThumb = function(base,listMovie,index) {
		var div = $("<div class='thumbnail' id='"+this.id+"'></div>");
		var thumbDisplay = $("<img src='" + this.thumbUrl+ "'/>");
		div.append(thumbDisplay);
		div.on("click",function () {
			base.empty();		// empty the main div
			// Order the listMovie table, thumbnail clicked is first
			var tmp = a2.movies[this.id];
			for(var i=index-1;i>=0;i--){
				listMovie[i+1] = listMovie[i];
			}
			listMovie[0]=tmp;
			a2.render(base,listMovie); // display the main page with new order in listMovie
		});
		base.append(div);
	};
};

// Function to play the video
a2.play = function (){
	var j_VideoElement = $("#videoElement");
	var videoElement = j_VideoElement[0];
	videoElement.play();
	localStorage.setItem(a2.listMovie[0].id,"read");

};

// Function to pause the video
a2.pause = function (){
	var j_VideoElement = $("#videoElement");
	var videoElement = j_VideoElement[0];
	videoElement.pause();
};

//Update the progress bar
a2.updatebar = function(x) {
	var videoPlayer = $("#videoElement")[0];
  	var progressBar = $('#progressBar');
  	var duration = videoPlayer.duration;
  	var position = x - progressBar.offset().left; //Click pos
  	var percentage = 100 * position / progressBar.width();
 
   //If user moves its mouse after the end of progress bar
   if(percentage > 100) {
      percentage = 100;
   }
   //If user moves its mouse before the beginning of progress bar
   if(percentage < 0) {
      percentage = 0;
   }
 
   //Update progress bar and video current time
   $('#timeBar').css('width', percentage+'%');
   videoPlayer.currentTime = duration * percentage / 100;
};

a2.fullScreen = function (){

	a2.onFullscreen = true; // Fullscreen mode enabled
	// Update the class of controls
	$("#play").addClass("playFullscreen");
	$("#pause").addClass("pauseFullscreen");
	$("#progressBar").addClass("progressBarFullscreen");
	$("#progressTime").addClass("progressTimeFullscreen");
	$("#videoDescription").addClass("videoDescriptionFullscreen");
	$(".thumbnail").hide();
	$("#fullScreen").hide();
	$("#defaultMode").show();
	$("#title").hide();
	$("#videoElement").hide();
	$("#videoElement").addClass("fillBrowser");
	$("#videoElement").fadeIn(2000);
	// if enter pressed, go back to default mode
	$(document).keypress(function(e) {
 		 if(e.which == 13) {
 		   a2.defaultMode();
 		 }
	});
	$("#alertFS").fadeIn(4000).fadeOut(2000); // display info about how to quit fullscreen mode
	var videoPlayer = $("#videoElement");
	videoPlayer.on("timeupdate", function() {
  		$('#current').text(this.currentTime.toFixed(2));
  		$('#duration').text(this.duration.toFixed(2));
  		var percentage = 100 * this.currentTime / this.duration;
   		$('#timeBar').css('width', percentage+'%');
   		localStorage.setItem('videoPlayed',a2.listMovie[0].id);
   		localStorage.setItem('currentTime',this.currentTime);	
   		if(this.currentTime>=0.25*this.duration) 
					$("#videoDescription").show();
		// if it's the end of the video and fullscreen mode enabled, play the next video
  		if(this.currentTime==this.duration && a2.onFullscreen) {
  			// Reorder the list of movie to play the next one
  			var tmp = a2.listMovie[0];
  			for(var i=1;i<a2.listMovie.length;i++){
  				a2.listMovie[i-1]=a2.listMovie[i];
  			}
  			a2.listMovie[a2.listMovie.length-1] = tmp;
  			$("#videoElement").replaceWith("<video id='videoElement' class='fillBrowser'><source src='"+a2.movies[a2.listMovie[0].id].contentUrl+"' type='video/mp4'></video>");
  			$("#videoDescription").replaceWith("<p id='videoDescription'>"+a2.movies[a2.listMovie[0].id].description+"</p>");
  			$("#videoDescription").hide();
  			$("#duration").empty();
  			$("#current").empty();
  			a2.play();		// play the next video
  			a2.fullScreen();
  		}
	});	

};

a2.defaultMode = function (){

	a2.onFullscreen = false;	// Disabled fullscreen mode
	$("#videoElement").removeClass("fillBrowser");
	$("#play").removeClass("playFullscreen");
	$("#pause").removeClass("pauseFullscreen");
	$("#progressBar").removeClass("progressBarFullscreen");
	$("#progressTime").removeClass("progressTimeFullscreen");
	$("#videoDescription").removeClass("videoDescriptionFullscreen");
	$(".thumbnail").show();
	$("#fullScreen").show();
	$("#title").show();
	$("#defaultMode").hide();
	

};

// function to random the order of objects in a table
a2.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

})(window.a2 = window.a2 || {}, jQuery)