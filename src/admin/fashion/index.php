<!DOCTYPE html>
<html>
	<head>
		<title>Product Feed Management</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../../common/styles/flat-ui.css" type="text/css">
		<link rel="stylesheet" href="styles/styles.css" type="text/css">
		<script type="text/javascript" src="../../common/scripts/vendor/require.js" data-main="scripts/main"></script>
		<?php

		require_once('../gateway/gateway.php');
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
		echo('<script type="text/javascript">window.authToken = ' . json_encode($token) . ';</script>');

		?>
	</head>
	<body>

		<form>
			<h2>Search for products</h2>
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

	</body>
</html>