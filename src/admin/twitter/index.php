<!DOCTYPE html>
<html>
	<head>
		<title>Incoming Tweets</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../../common/styles/bootstrap.css" type="text/css">
		<link rel="stylesheet" href="../../common/styles/flat-ui.css" type="text/css">
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
		<script type="text/javascript" src="../../common/scripts/vendor/require.js" data-main="scripts/main"></script>
	</head>	
	<body>
		<div id="container" class="well">
			<div class="column">
				<div class="columnHeader">
					<h1>Incoming Tweets</h1>
					<input type="textarea" id="filter">
					<button class="btn btn-warning">Change Filter</button>
				</div>
				<ul id="fullList">
					<li class="template">
						<div class="container">
							<a class="avatar" href="" target="_blank"><img></a>
							<div class="middleColumn">
								<h4 class="name"><a class="avatar" href="" target="_blank"></a></h4>
								<time></time>
								<div class="content"></div>
							</div>
							<button class="btn btn-success">Approve</button>
						</div>
					</li>
				</ul>
			</div>
			<div class="column">
				<div class="columnHeader">
					<h1>Approved Tweets</h1>
				</div>
				<ul id="partialList">
					<li class="template">
						<div class="container">
							<a class="avatar" href="" target="_blank"><img></a>
							<div class="middleColumn">
								<h4 class="name"><a class="avatar" href="" target="_blank"></a></h4>
								<time></time>
								<div class="content"></div>
							</div>
							<button class="btn btn-danger">Reject</button>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</body>
</html>