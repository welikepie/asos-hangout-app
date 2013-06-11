<!DOCTYPE html>
<html>
	<head>
		<title>Product Feed Management</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
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

				<label>Name: <input type="text" name="name" value=""></label>
				<label>Gender: <div>
					<label><input type="radio" name="gender" value="female"> Woman</label>
					<label><input type="radio" name="gender" value="male"> Man</label>
					<label><input type="radio" name="gender" value="" checked> Either</label>
				</div></label>

			</fieldset>
			<div class="buttons">
				<button type="submit">Search</button>
				<span class="loading"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABc0lEQVQ4jbWUW4ujQBBG8/9/myAdtJEoIZA0EcWkvESjdHL2YUmPmswos+wHPlh2na6btWGF6rqmrus1R9nMDdZamqbBWutsIoKIuPdhGMjznGEYloF93yMik4jmwCzLMMbQNM0y8Pl8UlUVIkLf92/A2+2GMYY0Tb9P+fF4OOdXSiJCWZbAtIbn8xljDF3XAX9LVBSFS3/zchARqqpyH7quc05jjaOtqoo4jtFaczgcvoDWWgcVkY+gudI0RWuN1pr9fu98JjXs+56yLFcDoyjier1O7G9N+VdtxqnOx2VJSZIQBIF7kiT5D8DfpPWTPjblfr8vOqZpShAEXC6Xd+BvxsYYg1IKpRS73Y62bb+A3w3269BYx+OR0+kEQFmWaK1RSpEkyTTCn369MAwJwxCA7XaL7/uTZZHn+TTCsT4tB8/z8DwPgKIo8H3fXTDXqvU1BgJEUYTv+2RZtgx8NWi8YOfAtm2J4/hjjVfN4biGS/oDazIVUuCNuEcAAAAASUVORK5CYII=" width="20" height="20"> Searching...</span>
			</div>
		</form>

		<div id="search-results" class="product-list">
			<h2>Search Results</h2>
			<ul>

				<li class="template">
					<img src="" class="image">
					<h3 class="name"></h3>
					<div class="description"></div>
					<a href="" target="_blank" class="url">View on site</a>
					<button type="button">Add to product feed</button>
				</li>

			</ul>
		</div>

		<div id="product-feed" class="product-list">
			<h2>Product Feed</h2>
			<ul>

				<li class="template">
					<img src="" class="image">
					<h3 class="name"></h3>
					<div class="description"></div>
					<a href="" target="_blank" class="url">View on site</a>
					<button type="button">Remove from product feed</button>
				</li>

			</ul>
		</div>

	</body>
</html>