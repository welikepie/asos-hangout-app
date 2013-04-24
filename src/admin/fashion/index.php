<!DOCTYPE html>
<html>
	<head>
		<title>Product Feed Management</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../../common/styles/bootstrap.css" type="text/css">
		<link rel="stylesheet" href="../../common/styles/flat-ui.css" type="text/css">
		<link rel="stylesheet" href="styles/custom_addon.css" type="text/css">
		<script type="text/javascript">
		window.authToken = <?php
			$headers = apache_request_headers();
			echo(json_encode(isset($headers['Authorization']) ? $headers['Authorization'] : null));
		?>;
		</script>
		<script type="text/javascript" src="../../common/scripts/vendor/require.js" data-main="scripts/main"></script>
	</head>
	<body>
		<div id="container" class="well">
			<div class="column">
				<div class="columnHeader">
					<h1>All outfits.</h1>
					<input type="textarea" id="searchBox">
					<button class="btn btn-warning">Search</button>
				</div>
				<ul id="fullList">
					<li class="template">
						<div class="container">
							<img class="image">
							<div class="middleColumn">
								<h4 class="name"></h4>
								<div class="description"></div>
								<a class="url">View this item on the site</a>
							</div>
							<button class="btn btn-success">Add</button>
						</div>
					</li>
				</ul>
			</div>
			<div class="column">
				<div class="columnHeader">
					<h1> Outfits selected.</h1>
					<button class="btn btn-warning">Clear All</button>
				</div>
				<ul id="partialList">
					<li class="template">
						<div class="container">
							<img class="image">
							<div class="middleColumn">
								<h4 class="name"></h4>
								<div class="description"></div>
								<a class="url">View this item on the site</a>
							</div>
							<button class="btn btn-danger">Remove</button>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</body>
</html>