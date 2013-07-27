<?php

require_once ('gateway/gateway.php');
$handler = new Dummy();

// Obtain list of all product categories
GatewayInterface::getCategories($handler, $handler);
$categories = json_decode($handler -> buffer[0], true);
unset($handler);

// Insert authorisation token
if (function_exists("apache_request_headers")) {
	$headers = apache_request_headers();
	if (isset($headers['Authorization'])) { $token = $headers['Authorization'];
	} else { $token = null;
	}
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { $token = $_SERVER['HTTP_AUTHORIZATION'];
} else { $token = null;
}
?><!DOCTYPE html><html>
	<head>
		<title>ASOS Shop-Along Twitter Admin</title>
		<base href="" data-base-url="<%= pkg.app.baseUrl %>" data-node-url="<%= pkg.app.nodeUrl %>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../common/styles/flat-ui.css">
		<link rel="stylesheet" href="styles/styles.css">
		<link rel="stylesheet" href="styles/spinner.css">
		<script type="text/javascript">
			window.authToken = <?php echo(json_encode($token)); ?>
			;
		</script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js" data-main="scripts/mainTwitter"></script>
			<script type="text/javascript" src="scripts/tweetResize.js"></script>
	</head>
	<body>
		<div class="menu">
			<a class="general" target="_blank" href="hangout.php">General Settings</a>
			<a class="products"target="_blank" href="items.php">Product Feed</a>
			<a class="twitter" target="_blank"href="twitter.php">Twitter Feed</a>
			<button type="button" class="btn btn-danger reset">Reset App</button>
		</div>
		<div class="root">
		<section id="twitter">

			<div class="wrapper">

				
				<div class="filter">
					<h2>
					Twitter Feed
				</h2>
					<p>
						Specify the term by which tweets should appear (if empty, no tweets will be streamed).
					</p>
					<input type="text" name="twitter_filter" value="">
					<button type="button" class="btn">
						Filter
					</button>
				</div>
				<div class="product-list incoming-tweets">
					<h2>Incoming Tweets</h2>
					<ul>

						<li class="template">
							<img src="" class="avatar">
							<h3 class="name"><a href="" target="_blank"></a></h3>
							<time></time>
							<div class="content"></div>
							<button type="button" class="btn btn-success">
								Add to feed
							</button>
						</li>

					</ul>
				</div>
				<div class="product-list twitter-feed">
					<h2>Twitter Feed
					<button type="button" class="btn btn-warning clear-all">
						Clear All
					</button></h2>
					<ul>

						<li class="template">
							<img src="" class="avatar">
							<h3 class="name"><a href="" target="_blank"></a></h3>
							<time></time>
							<div class="content"></div>
							<button type="button" class="btn btn-danger">
								Remove from feed
							</button>
						</li>

					</ul>
				</div>
			</div>

		</section>
		</div>
	</body>
</html>
