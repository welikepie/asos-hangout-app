<?php
$glueArr = array("ENG" => "UK", "RUS" => "RU", "FRA" =>"FR","DEU"=>"DE","ITA"=>"IT","USD"=>"US","AUD"=>"AU","SPA"=>"ES");
$jsonEnc = json_decode(file_get_contents("<%= pkg.app.nodeUrl %>/app-options"),true);
$jsonFilter = json_decode(file_get_contents("scripts/filter.json"),true);
require_once ('gateway'.$glueArr[$jsonEnc["currency"]].'/gateway.php');
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
function in_array_ci($needle, $haystack) 
{
 return in_array( strtolower($needle), array_map('strtolower', $haystack) );
}

?>
<!DOCTYPE html>
<html>
	<head>

		<title>ASOS Shop-Along Items Admin</title>
		<script type="text/javascript">var startLanguage = "<?php echo($glueArr[$jsonEnc["currency"]]);?>"; var filterArr = <?php echo json_encode($jsonFilter); ?>;</script>
		<base href="" data-base-url="<%= pkg.app.baseUrl %>" data-node-url="<%= pkg.app.nodeUrl %>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<link rel="stylesheet" href="../common/styles/flat-ui.css">
		<link rel="stylesheet" href="styles/styles.css">
		<link rel="stylesheet" href="styles/spinner.css">
		<script type="text/javascript">window.authToken = <?php echo(json_encode($token)); ?>;</script>
		<script type="text/javascript" src="../common/scripts/vendor/require.js" data-main="scripts/mainItems"></script>
		<script type="text/javascript" src="scripts/itemsResize.js"></script>
	</head>
	<body>
		<div class="menu">
			<a class="general" target="_blank" href="hangout.php">General Settings</a>
			<a class="products"target="_blank" href="items.php">Product Feed</a>
			<a class="twitter" target="_blank"href="twitter.php">Twitter Feed</a>
			<button type="button" class="btn btn-danger reset">Reset App</button>
		</div>
		<div class="root">
		<section id="products">

				<div class="wrapper">
					
					<form class="product-search">
<h2>Search</h2>
						<fieldset class="misc">
							<!--<legend>&nbsp;</legend>-->
							<input type="text" name="name" value="">
							<span> <div>
								<label><input type="radio" name="gender" value="female"> Woman</label>
								<label><input type="radio" name="gender" value="male"> Man</label>
								<label><input type="radio" name="gender" value="" checked> Either</label>
							</div></span>
						</fieldset>
						<div class="buttons">
							<button type="submit" class="btn btn-success">Search</button>
							<button type="button" class="btn clear">Clear</button>
						</div>
						<fieldset class="categories">
							<legend>Categories</legend>
							<label><input type="checkbox" class="all-categories" checked> Select/Deselect All</label>
						
							<div><?php
					
							foreach ($categories as &$item) {
								if(!in_array_ci("num",$jsonFilter) ){
									echo('<label><input type="checkbox" name="category" value="' . $item['id'] . '" checked> ' . $item['name'] . '</label>');
								}
								else{
									echo('<label style="display:none;"><input type="checkbox" name="category" value="' . $item['id'] . '" checked> ' . $item['name'] . '</label>');
								}
							}
							
 							?>
 							</div>
						</fieldset>
					</form>
					<div class="results-container">
					<div id="search-results" class="product-list">
						<h2>Search Results</h2>
						<div class="listContainer">

						<div class="spinner">
								<div class="wBall" id="wBall_1">
									<div class="wInnerBall">
									</div>
								</div>
								<div class="wBall" id="wBall_2">
									<div class="wInnerBall">		
									</div>
								</div>
								<div class="wBall" id="wBall_3">
									<div class="wInnerBall">										
									</div>
								</div>
								<div class="wBall" id="wBall_4">
									<div class="wInnerBall">											
									</div>
								</div>
								<div class="wBall" id="wBall_5">
									<div class="wInnerBall">					
									</div>
								</div>
							</div>
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
					</div>

					<div id="product-feed" class="product-list">
						<h2>Product Feed <button type="button" class="btn btn-warning clear-all">Clear All</button></h2>
							<div class="listContainer">
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
				</div>
				</div>

			</section>
		</div>
		</body>
		</html>
		