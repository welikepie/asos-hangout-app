<?php

	require_once('gateway/gateway.php');
	$handler = new Dummy();

	// Obtain list of all product categories
	GatewayInterface::getCategories($handler, $handler);
	$categories = json_decode($handler->buffer[0], true);
	unset($handler);

	// Insert authorisation token
	if (function_exists("apache_request_headers")) {
		$headers = apache_request_headers();
		if (isset($headers['Authorization'])) { $token = $headers['Authorization']; }
		else { $token = null; }
	}
	elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { $token = $_SERVER['HTTP_AUTHORIZATION']; }
	else { $token = null; }

?><!DOCTYPE html>
<html>
	<head>
		<title>ASOS Shop-Along Admin</title>
		<base href="" data-base-url="<%= pkg.app.baseUrl %>" data-node-url="<%= pkg.app.nodeUrl %>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../common/styles/flat-ui.css">
		<link rel="stylesheet" href="styles/styles.css">
		<script type="text/javascript">window.authToken = <?php echo(json_encode($token)); ?>;</script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js" data-main="scripts/main"></script>
	</head>
	<body>
		<div class="menu">
			<a class="general" href="#general">General Settings</a>
			<a class="products" href="#products">Product Feed</a>
			<a class="twitter" href="#twitter">Twitter Feed</a>

			<button type="button" class="btn btn-danger reset">Reset App</button>
		</div>
		<div class="root">

			<section id="introduction">
				<header>ASOS Shop-Along Admin</header>
				<p>This administration panel contains the interface to control the ASOS Shop-Along hangout process, as well as contents of product and Twitter feed.</p>
			</section>

			<section id="general">

				<header>General Settings</header>

				<div class="hangouts">
					<h2>Hangouts</h2>
					<p>Link to main hangout:</p>
					<a href="https://plus.google.com/hangouts/_?hso=0&amp;gid=<%= pkg.app.hangoutAdminAppId %>" target="_blank" class="main">NO HANGOUT - CLICK HERE TO START ONE</a>
					<p>Link to staging hangout:</p>
					<a href="https://plus.google.com/hangouts/_?gid=<%= pkg.app.stagingAdminAppId %>" target="_blank" class="staging">NO HANGOUT - CLICK HERE TO START ONE</a>
					<p>Hangout Live Stream:</p>
					<a target="_blank" class="embed">NOT AVAILABLE, START ON-AIR HANGOUT FIRST</a>
					<p>&quot;Shop Special Events&quot; Link</p>
					<div class="categoryLink"><input type="text" name="categoryLink" value=""><button type="button" class="btn">Change</button></div>
				</div>
					
				<div class="live-message">
					<h2>Live Message</h2>
					<textarea></textarea>
				</div>

			</section>

			<section id="products">

				<div class="wrapper">

					<header>Product Feed</header>

					<form class="product-search">
						<fieldset class="categories">
							<legend>Categories</legend>
							<label><input type="checkbox" class="all-categories" checked> Select/Deselect All</label>
							<div><?php foreach ($categories as &$item) {
								echo('<label><input type="checkbox" name="category" value="' . $item['id'] . '" checked> ' . $item['name'] . '</label>');
							} ?></div>
						</fieldset>
						<fieldset class="misc">
							<legend>&nbsp;</legend>
							<label>Name: <input type="text" name="name" value=""></label>
							<span>Gender: <div>
								<label><input type="radio" name="gender" value="female"> Woman</label>
								<label><input type="radio" name="gender" value="male"> Man</label>
								<label><input type="radio" name="gender" value="" checked> Either</label>
							</div></span>
						</fieldset>
						<div class="buttons">
							<button type="submit" class="btn btn-success">Search</button>
							<button type="button" class="btn clear">Clear</button>
						</div>
					</form>

					<div id="search-results" class="product-list">
						<h2>Search Results</h2>
						<ul>

							<li class="template">
								<img src="" class="image">
								<h3 class="name"></h3>
								<div class="description"></div>
								<div class="actions">
									<a href="" target="_blank" class="url">View on site</a>
									<button type="button" class="btn btn-success">Add to product feed</button>
								</div>
							</li>

						</ul>
					</div>

					<div id="product-feed" class="product-list">
						<h2>Product Feed <button type="button" class="btn btn-warning clear-all">Clear All</button></h2>
						<ul>

							<li class="template">
								<img src="" class="image">
								<h3 class="name"></h3>
								<div class="description"></div>
								<div class="actions">
									<a href="" target="_blank" class="url">View on site</a>
									<button type="button" class="btn btn-danger">Remove from product feed</button>
								</div>
							</li>

						</ul>
					</div>

				</div>

			</section>

			<section id="twitter">

				<div class="wrapper">

					<header>Twitter Feed</header>

					<div class="filter">
						<p>Specify the term by which tweets should appear (if empty, no tweets will be streamed).</p>
						<input type="text" name="twitter_filter" value=""><button type="button" class="btn">Filter</button>
					</div>

					<div class="product-list incoming-tweets">
						<h2>Incoming Tweets</h2>
						<ul>

							<li class="template">
								<img src="" class="avatar">
								<h3 class="name"><a href="" target="_blank"></a></h3>
								<time></time>
								<div class="content"></div>
								<button type="button" class="btn btn-success">Add to feed</button>
							</li>


						</ul>
					</div>

					<div class="product-list twitter-feed">
						<h2>Twitter Feed <button type="button" class="btn btn-warning clear-all">Clear All</button></h2>
						<ul>

							<li class="template">
								<img src="" class="avatar">
								<h3 class="name"><a href="" target="_blank"></a></h3>
								<time></time>
								<div class="content"></div>
								<button type="button" class="btn btn-danger">Remove from feed</button>
							</li>

						</ul>
					</div>

				</div>

			</section>

		</div>
	</body>
</html>