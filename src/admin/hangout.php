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
?><!DOCTYPE html>
<html>
	<head>
		<title>ASOS Shop-Along Hangout Admin</title>
		<base href="" data-base-url="<%= pkg.app.baseUrl %>" data-node-url="<%= pkg.app.nodeUrl %>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../common/styles/flat-ui.css">
		<link rel="stylesheet" href="styles/styles.css">
		<link rel="stylesheet" href="styles/spinner.css">
		<script type="text/javascript">window.authToken = <?php echo(json_encode($token)); ?>;</script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js" data-main="scripts/main"></script>
	</head>
	<body>
		<div class="menu">
			<a class="general" target="_blank" href="hangout.php">General Settings</a>
			<a class="products"target="_blank" href="items.php">Product Feed</a>
			<a class="twitter" target="_blank"href="twitter.php">Twitter Feed</a>

			<button type="button" class="btn btn-danger reset">Reset App</button>
		</div>
<div class="root">
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
		</body>
	</div>
		</html>