var fullClothes  = new Backbone.Collection;
var endpoint = ""; //URL to send the requests to.
var basicToken = authentToken; //this is pulled through from the DOM
console.log(basicToken);
//pulling the base JSON through containing the fashion objects and rendering to dom
fullClothes.fetch({url:"data/testFile.json",success:function(message){search("");}});
var searchResults = new Backbone.Collection;

var fullClothesList = Backbone.View.extend(function () {
			var props = {
				'collection': searchResults,
				// In one swoop, we setup container element and DOM template for creating new product entries
				'template': $('#fullList > li.template').remove().removeClass('template'),
				'el': $('#fullList'),
				'initialize': function () {
					// These four simple bindings make it so that the view
					// automatically rerenders after any change to the collection
					this.listenTo(this.collection, 'add', this.render);
					this.listenTo(this.collection, 'remove', this.render);
					this.listenTo(this.collection, 'reset', this.render);
					this.listenTo(this.collection, 'sort', this.render);
				}
			};
			
			// The actual render function, defined as property in name different than "render"
			// due to the fact that the "render" will be debounced.
			props.immediateRender = function () {

				var that = this;
				
				// We be cleaning up any events and DOM in view's container...
				this.$el
					.off()
					.empty();

				// ...then going over each model in collection to render it.
				this.collection.each(function (model) {

					//renderEach(model,this.$el);
						var element = that.template.clone()
						.find('.name').html(model.get('name')).end()
						.find('.descriptions').html($(model.get('description')).text().substring(0,140)+"...").end()
						.find('.btn-success').html("add").attr('onclick','(function(){modify('+model.get('id')+',"add")})();').end()
						.find('.url').attr('href', model.get('url')).html("View this item on the site.").end()
						.find('.img').attr('src', model.get('photo_small')).end();
						//.find('.descriptions').html(model.get('description')).end();

						that.$el.append(element);
				});

				return this;

			};
			// And the debounced version of render, used as an official one.
			// This way, the rendering doesn't go haywire on multiple
			// consecutive changes.
			props.render = _.debounce(props.immediateRender, 250);

			return props;
			
			
}());
fullClothesList = new fullClothesList();
var partialClothes = new Backbone.Collection;
var partialClothesList = Backbone.View.extend(function () {

			var props = {
				'collection': partialClothes,
				// In one swoop, we setup container element and DOM template for creating new product entries
				'template': $('#partialList > li.template').remove().removeClass('template'),
				'el': $('#partialList'),
				'initialize': function () {
					// These four simple bindings make it so that the view
					// automatically rerenders after any change to the collection
					this.listenTo(this.collection, 'add', this.render);
					this.listenTo(this.collection, 'remove', this.render);
					this.listenTo(this.collection, 'reset', this.render);
					this.listenTo(this.collection, 'sort', this.render);
				}
			};
			
			// The actual render function, defined as property in name different than "render"
			// due to the fact that the "render" will be debounced.
			props.immediateRender = function () {

				var that = this;
				
				// We be cleaning up any events and DOM in view's container...
				this.$el
					.off()
					.empty();

				// ...then going over each model in collection to render it.
				this.collection.each(function (model) {

					//renderEach(model,this.$el);

						var element = that.template.clone()
	.find('.name').html(model.get('name')).end()
						.find('.descriptions').html($(model.get('description')).text().substring(0,140)+"...").end()
		
						.find('.url').attr('href', model.get('url')).html(model.get('name')).end()
						.find('.btn-danger').html("remove").attr('onclick','(function(){modify('+model.get('id')+',"remove")})();').end()
						.find('.img').attr('src', model.get('photo_small')).end();
						//.find('.descriptions').html(model.get('description')).end();

						that.$el.append(element);
				});

				return this;

			};
			// And the debounced version of render, used as an official one.
			// This way, the rendering doesn't go haywire on multiple
			// consecutive changes.
			props.render = _.debounce(props.immediateRender, 250);
			return props;
}());

partialClothesList = new partialClothesList();
//ADD LISTENER TO WRITE TO partialClothes ON LOAD FROM THE CURRENT FASHION OBJECT STATE
//searches based on whether name or description contains searched parameter
function search(param){
	if(param==""){
		searchResults.reset([]);
		var thing = fullClothes.toJSON();
		console.log(fullClothes);
		for(var i = 0; i < thing.length; i++){
			searchResults.add(thing[i]);
			console.log(thing[i]);
		}
		console.log(searchResults);
	}
	else{
		searchResults.reset([]);
		var thing = fullClothes.toJSON();
		for(var i = 0; i < thing.length; i++){
			if(thing[i].description != undefined){
				if(thing[i].description.toLowerCase().indexOf(param.toLowerCase())!=-1||thing[i].name.toLowerCase().indexOf(param.toLowerCase())!=-1)
				{searchResults.add(thing[i]);}
			}
		}
	}
}
//partialClothesList.on("all",(function(msg){console.log(msg)})());
//modifying objects with the content to append and the type of operation
function modify(idNum, type){
		var xmlhttp = new XMLHttpRequest();
	if(type=="add" && partialClothes.findWhere({id:idNum}) == undefined){
		console.log("adding");
		var funde = fullClothes.findWhere({id:idNum});
		partialClothes.add(funde);
		console.log(funde.toJSON());
		xmlhttp.open("POST",endpoint,false);
		xmlhttp.setRequestHeader("Authorization", basicToken);
		xmlhttp.send(funde.toJSON());
	}
	if(type=="remove" && partialClothes.findWhere({id:idNum}) != undefined){
		console.log("removing");
		partialClothes.remove(partialClothes.findWhere({id:idNum}));
		console.log("id: "+idNum);
		xmlhttp.open("DELETE",endpoint,false);
		xmlhttp.setRequestHeader("Authorization", basicToken);
		xmlhttp.send();
		 var obj = new Object();
   		obj.id=idNum;
		console.log(JSON.stringify(obj));
	}
	
}

