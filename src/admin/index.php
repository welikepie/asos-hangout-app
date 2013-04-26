<!DOCTYPE html>
<html>
	<head>
		<title>Admin Page For Twitter</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../common/styles/bootstrap.css" type="text/css">
		<link rel="stylesheet" href="../common/styles/flat-ui.css" type="text/css">	
		<link rel="stylesheet" href="styles/custom_addon.css" type="text/css">
		<script type="text/javascript">
		window.authToken = <?php
			if (function_exists("apache_request_headers")) {
				$headers = apache_request_headers();
				if (isset($headers['Authorization'])) { $token = $headers['Authorization']; }
				else { $token = null; }
			}
			elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { $token = $_SERVER['HTTP_AUTHORIZATION']; }
			else { $token = null; }
			echo(json_encode($token));
		?>;
		</script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js" data-main="scripts/main"></script>
	</head>
	<body>
		<div id="container" class="well span7 offset2" style="height:100%;">

			<h1>Administration Page</h1>
			<h3>ASOS fashion.</h3>
			<p>Welcome to the back end administration page for the google hangouts.</p>
			<div id="hangoutEmbed">
				<input type="text" name="hangoutEmbed">
				<button type="button">Embed Hangout</button>
			</div>
			<div id="liveMessage">
				<p>Message typed below will be updated live for everyone in the app.</p>
				<textarea></textarea>
			</div>

			<ul>
				<li>
					<div class="panelWrapper">
						<p>The Fashion administration page lets the administrator decide which clothes appear in the hangout app.</p>
						<a href="fashion" class="btn button">Fashion</a>
					</div>
				</li>
				<li>
					<div class="panelWrapper">
						<p>The Twitter administration page lets the administrator decide which tweets appear in the hangout app.</p>
						<a href="twitter" class="btn button">Twitter</a>
					</div>
				</li>
			</ul>

		</div>
	</body>
</html>