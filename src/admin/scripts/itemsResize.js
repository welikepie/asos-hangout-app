function wndsize(){
var w = 0;var h = 0;
//IE
if(!window.innerWidth){
    if(!(document.documentElement.clientWidth == 0)){
        //strict mode
        w = document.documentElement.clientWidth;h = document.documentElement.clientHeight;
    } else{
        //quirks mode
        w = document.body.clientWidth;h = document.body.clientHeight;
    }
} else {
    //w3c
    w = window.innerWidth;h = window.innerHeight;
}
return {width:w,height:h};
}
window.onload = function(){
resize();
}

window.onresize = function(){
	resize();
}

var resize = function(){
var wide = wndsize().width;
var high = wndsize().height;
if(wide<850){
	wide=850;
}
if(high < 400){
	high = 400;
}
console.log(wide+","+high);
var playAreaWide = ((wide-64-240)/2);
var playWideMargin = playAreaWide * 0.03;
playAreaWide = Math.ceil(playAreaWide - Math.ceil(playWideMargin*2));
var elements = document.getElementsByClassName("product-list");
for (var i = 0; i < elements.length; i++) {
 //   	console.log(elements[i]);
	elements[i].style.marginLeft = Math.floor(playWideMargin)+"px";
	elements[i].style.width = Math.floor(playAreaWide)+"px";
	console.log(Math.ceil(playAreaWide - playWideMargin));  
}
document.getElementsByClassName("results-container")[0].style.width = Math.floor((playWideMargin*2) +(playAreaWide*2))+"px";
document.getElementsByClassName("categories")[0].children[2].style.height = high - (32+32+12+90+90+32+16)+"px";	
}
