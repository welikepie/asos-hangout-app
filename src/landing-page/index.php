<?php session_start(); ?><!DOCTYPE html>
<html>
	<head>
		<title>ASOS Shop-Along</title>
		<base href="" data-base-url="<%= pkg.app.baseUrl %>" data-node-url="<%= pkg.app.nodeUrl %>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
		<link rel="stylesheet" href="styles/styles.css">
		<script type="text/javascript" src="../common/scripts/vendor/json3.js"></script>
		<script type="text/javascript" src="../common/scripts/vendor/modernizr.js"></script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js"></script>
		<script type="text/javascript" src="scripts/main.js"></script>
		<script type="text/javascript">
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', 'UA-1005942-86']);
			_gaq.push(['_setDomainName', 'asos.com']);
			_gaq.push(['_setAllowLinker', true]);
			_gaq.push(['_trackPageview']);

			(function () {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
			!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
			(function(d, s, id) {
			  var js, fjs = d.getElementsByTagName(s)[0];
			  if (d.getElementById(id)) return;
			  js = d.createElement(s); js.id = id;
			  js.src = "//connect.facebook.net/en_GB/all.js#xfbml=1";
			  fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));
			(function() {
			    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
			    po.src = 'https://apis.google.com/js/plusone.js';
			    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
			  })();

			window.localID = <?php
				$local_id = isset($_SESSION['user_data']) ? $_SESSION['user_data']['id'] : null;
				echo(json_encode($local_id));
			?>;
		</script>
	</head>
	<body>

		<div class="top-nav">
			<nav>
				<a href="http://www.asos.com/?hrd=1" class="active">ASOS</a>
				<a href="https://marketplace.asos.com/?WT.ac=ASOS_grpnav_UK">Marketplace</a>
				<a href="http://fashionfinder.asos.com/?WT.ac=ASOS_grpnav_UK">Outfits &amp; Looks</a>
				<a href="http://www.asos.com/blogs?WT.ac=ASOS_grpnav_UK">Blog</a>
			</nav>
		</div>

		<div class="container">
			<header>
				<div class="nav">
					<a href="http://m.asos.com/mt/www.asos.com/Women/?un_jtt_v_show=navigation" class="mobile navigation">Menu</a>
					<a href="http://www.asos.com/?hrd=1" class="logo">ASOS</a>
					<a href="http://m.asos.com/mt/www.asos.com/basket/pgebasket.aspx" class="mobile cart">Shopping Cart</a>
					<a href="http://m.asos.com/mt/www.asos.com/basket/pgebasket.aspx?un_jtt_v_show=wishlist" class="mobile wishlist">Wishlist</a>
				</div>
				<div class="categories">
					<a class="home" href="http://www.asos.com/?hrd=1">Home</a>
					<a href="http://www.asos.com/Women/?&amp;via=top">Women</a>
					<a href="http://www.asos.com/Men/?&amp;via=top">Men</a>
				</div>

				<div class="banner">
					<div class="shop-along-logo">ASOS Shop-Along</div>
					<p class="left">Tweet <span class="hashtag">#askasos</span> to look&nbsp;the&nbsp;part</p>
					<p class="right">Special event style, sorted</p>
				</div>
			</header>

			<section id="stream-embed">
				<img class="ratio" src="images/ratio-16-10.gif">
				<iframe src="" frameborder="0" allowfullscreen></iframe>
			</section>

			<section id="product-feed">
				<h1>Shop-Along</h1>

				<div class="switcher-ext">
					<div class="switcher">
						<img src="images/ratio-27-39.gif">
						<ul><li class="template">
							<a href="" target="_blank">
								<img src="">
								<h2 class="title"></h2>
								<h3 class="price"></h3>
							</a>
						</li></ul>
					</div>
					<a class="prev"></a>
					<a class="next"></a>
				</div>

				<a href="" target="_blank" class="desc">
					<h2 class="title"></h2>
					<h3 class="price"></h3>
				</a>

				<a href="" target="_blank" class="shop">Shop Special Events&nbsp;›</a>
			</section>

			<section id="twitter-feed">
				<h1>#askasos</h1>
				<div id="live-message" class="blink"></div>
				<a href="https://twitter.com/asos" target="_blank" class="twitter">Join us</a>

				<div class="switcher">
					<ul><li class="template">
							<a href="" target="_blank">
								<img class="avatar" src="">
								<h2></h2>
							</a>
							<p class="time"></p>
							<p class="tweet"></p>
						</li></ul>
					<a class="prev"></a>
					<a class="next"></a>
				</div>
			</section>

			<section id="audience-queue">
				<h1>Queue</h1>
				<a class="join-queue visible" href="join.php">Join Queue</a>

				<div class="switcher">
					<ul><li class="template">
							<a href="" target="_blank">
								<img class="avatar" src="">
								<h2></h2>
							</a>
						</li></ul>
					<a class="prev"></a>
					<a class="next"></a>
				</div>
				<div class="invitation">
					You have been invited to hangout:<br><a href=""></a>
				</div>
			</section>

			<section id="sharing">
				<div class="fb-like" data-send="false" data-layout="button_count" data-width="120" data-show-faces="false"></div>
				<g:plus action="share" annotation="bubble"></g:plus>
				<a href="https://twitter.com/share" class="twitter-share-button">Tweet</a>
			</section>
		</div>

		<footer>

			<section class="social">
				<p>Our social places:</p>
				<a href="https://www.facebook.com/ASOS" target="_blank" class="facebook">Facebook</a>
				<a href="https://twitter.com/ASOS" target="_blank" class="twitter">Twitter</a>
				<a href="http://pinterest.com/asos/" target="_blank" class="pinterest">Pinterest</a>
				<a href="https://plus.google.com/+ASOS" target="_blank" class="google">Google Plus</a>
			</section>

			<section class="misc">
				&copy; 2013 ASOS |
				<a href="http://www.asos.com/infopages/pgetandc.aspx">T&amp;C's</a> |
				<a href="http://www.asos.com/infopages/pgeprivacy.aspx">Privacy &amp; Cookies</a> |
				<a href="https://www.asos.com/account/pgereceipttracking.aspx">Track order</a> |
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level11">Delivery</a> |
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level11">Returns</a> |
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level10">Help &amp; Contact</a> |
				<a href="http://www.asos.com/infopages/pgecontactcare.aspx">Contact us</a> |
				<a href="http://www.asos.com/?hrd=1">ASOS Full Site</a>
			</section>
			<section class="misc-mobile closed">
				<a href="https://www.asos.com/account/pgereceipttracking.aspx">Track order ›</a>
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level11">Delivery ›</a>
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level11">Returns ›</a>
				<a href="http://www.asos.com/infopages/pgehelpdesk.aspx#/level10">Help &amp; Contact ›</a>
				<a href="http://www.asos.com/?hrd=1">ASOS Full Site ›</a>
				<div class="bottom">
					&copy; 2013 ASOS <a href="http://www.asos.com/infopages/pgeprivacy.aspx">Privacy &amp; Cookies</a><a href="http://www.asos.com/infopages/pgetandc.aspx">T&amp;C's</a>
				</div>
			</section>

		</footer>

	</body>
</html>