var tweetObject  = new Backbone.Collection;
var endpoint = ""; //URL to send the requests to.
var basicToken = authentToken; //this is pulled through from the DOM
console.log(basicToken);
//retrieving tweets from a sample object "data/testFile. ". 
tweetObject.fetch({url:"data/testFile.json",success:function(message){search("");}});
var searchResults = new Backbone.Collection;
var maxSizeOfIncoming = 50; //max size for new tweets
var maxSizeOfSelected = 20; //max size for selected tweets
var tweetObjectList = Backbone.View.extend(function () {
			var props = {
				'collection': searchResults,
				// In one swoop, we setup container element and DOM template for creating new product entries
				'template': $('#fullList > li.template').remove().removeClass('template'),
				'el': $('#fullList'),
				'initialize': function () {
					// These four simple bindings make it so that the view
					// automatically rerenders after any change to the collection
					//on add, make sure that the limit of the list isn't being overran;
					this.listenTo(this.collection, 'add', function(){this.render();popCheck(this.collection,maxSizeOfIncoming)});
					this.listenTo(this.collection, 'remove', this.render);
					this.listenTo(this.collection, 'reset', this.render);
					this.listenTo(this.collection, 'sort', this.render);
				}
			};
			
			// The actual render function, defined as property in name different than "render"
			// due to the fact that the "render" will be debounced.
			props.immediateRender = function () {
console.log("calling render2");
				var that = this;
				
				// We be cleaning up any events and DOM in view's container...
				this.$el
					.off()
					.empty();

				// ...then going over each model in collection to render it. Going backwards to render most recently added first.
				for(var i = this.collection.length-1; i >= 0; i--){
						var model = this.collection.at(i);
	

					//renderEach(model,this.$el);
						var element = that.template.clone()
						.find('.tweeter').html(model.get('name')).end()
						.find('.content').html(model.get('tweet')).end()
						.find('.url').attr('href', model.get('url')).html(model.get('name')).end()
						.find('.btn-success').html("add").attr('onclick','(function(){modify('+JSON.stringify(model.get('url'))+',"add")})();').end()
						.find('.url').attr('href', model.get('url')).html("View this tweet on twitter.").end()
						.find('.img').attr('src', model.get('photo')).end();
						
						//.find('.descriptions').html(model.get('description')).end();
						that.$el.append(element);
				}

				return this;

			};
			// And the debounced version of render, used as an official one.
			// This way, the rendering doesn't go haywire on multiple
			// consecutive changes.
			props.render = _.debounce(props.immediateRender, 250);

			return props;
			
			
}());
tweetObjectList = new tweetObjectList();
var selectedTweets = new Backbone.Collection;
var selectedTweetsList = Backbone.View.extend(function () {

			var props = {
				'collection': selectedTweets,
				// In one swoop, we setup container element and DOM template for creating new product entries
				'template': $('#partialList > li.template').remove().removeClass('template'),
				'el': $('#partialList'),
				'initialize': function () {
					// These four simple bindings make it so that the view
					// automatically rerenders after any change to the collection
					this.listenTo(this.collection, 'add',function(){this.render();popCheck(this.collection,maxSizeOfSelected);});
					this.listenTo(this.collection, 'remove', this.render);
					this.listenTo(this.collection, 'reset', this.render);
					this.listenTo(this.collection, 'sort', this.render);
				}
			};
			
			// The actual render function, defined as property in name different than "render"
			// due to the fact that the "render" will be debounced.
			props.immediateRender = function () {
console.log("calling render");
				var that = this;
				
				// We be cleaning up any events and DOM in view's container...
				this.$el
					.off()
					.empty();

				// ...then going over each model in collection to render it.
				for(var i = this.collection.length-1; i >= 0; i--){
						var model = this.collection.at(i);
					//renderEach(model,this.$el);
						var element = that.template.clone()
						.find('.tweeter').html(model.get('name')).end()
						.find('.content').html(model.get('tweet')).end()
						.find('.url').attr('href', model.get('url')).html("View this tweet on twitter.").end()
						.find('.btn-danger').html("remove").attr('onclick','(function(){modify('+JSON.stringify(model.get('url'))+',"remove")})();').end()
						.find('.img').attr('src', model.get('photo')).end();
						//.find('.descriptions').html(model.get('description')).end();

						that.$el.append(element);
				
				}

				return this;

			};
			// And the debounced version of render, used as an official one.
			// This way, the rendering doesn't go haywire on multiple
			// consecutive changes.
			props.render = _.debounce(props.immediateRender, 250);
			return props;
}());

selectedTweetsList = new selectedTweetsList();

//SETUP FOR LISTENER FOR NEW TWEETS GO HERE. ADD NEW TWEETS IN PRESCRIBED FORMAT TO selectedTweets

function search(param){
	if(param==""){ //searches by iterating over locally held object and updating locally.
		searchResults.reset([]);
		var thing = tweetObject.toJSON();
		console.log(tweetObject);
		for(var i = 0; i < thing.length; i++){
			searchResults.add(thing[i]);
			console.log(thing[i]);
		}
		console.log(searchResults);
	}
	else{
		searchResults.reset([]);
		var thing = tweetObject.toJSON();
		for(var i = 0; i < thing.length; i++){
			if(thing[i].description != undefined && thing){
				if(thing[i].description.toLowerCase().indexOf(param.toLowerCase())!=-1||thing[i].name.toLowerCase().indexOf(param.toLowerCase())!=-1)
				{searchResults.add(thing[i]);}
			}
		}
	}
}
//selectedTweetsList.on("all",(function(msg){console.log(msg)})());
//ADD LISTENER TO SET THE OB
function popCheck(coll,maxVal){
		//console.log(coll);
	//	popCheck("searchResults",maxSizeOfIncoming);
	console.log(coll.length+","+maxVal);
	if(coll.length > maxVal){
		while(coll.length > maxVal){
			coll.remove(coll.at(0));
		}
	}
}

function modify(urlText, type){
	//if type is add, get element and set up xmlhttp requet with BASIC auth token as the Authorization value in the header of request.
	var xmlhttp = new XMLHttpRequest();
	if(type=="add" && selectedTweets.findWhere({url:urlText}) == undefined){
		console.log("adding");
		var funde = tweetObject.findWhere({url:urlText});
		selectedTweets.add(funde);
		xmlhttp.open("POST",endpoint,false);
		xmlhttp.setRequestHeader("Authorization", basicToken);
		xmlhttp.send(funde.toJSON());
	}
	if(type=="remove" && selectedTweets.findWhere({url:urlText}) != undefined){
		console.log("removing");
		selectedTweets.remove(selectedTweets.findWhere({url:urlText}));
 var obj = new Object();
   obj.url=urlText;
   console.log(JSON.stringify(obj));	
		xmlhttp.open("DELETE",endpoint,false);
		xmlhttp.setRequestHeader("Authorization", basicToken);
		xmlhttp.send(urlText);
	}
	
}

