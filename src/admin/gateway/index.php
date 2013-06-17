<?php

	define('URL_PREFIX', '/asos-hangout-dev/admin/gateway');
	require_once(__DIR__ . '/gateway.php');
	require_once(__DIR__ . '/zaphpa/zaphpa.lib.php');
	$router = new Zaphpa_Router();
	$router->attach('ZaphpaCORS');

	$router->addRoute(array(
		'path' => URL_PREFIX . '/category',
		'get' => array('GatewayInterface', 'getCategories')
	));
	$router->addRoute(array(
		'path' => URL_PREFIX . '/category/{category_id}',
		'handlers' => array('category_id' => Zaphpa_Constants::PATTERN_DIGIT),
		'get' => array('GatewayInterface', 'getCategories')
	));

	$router->addRoute(array(
		'path' => URL_PREFIX . '/products',
		'get' => array('GatewayInterface', 'getProducts')
	));
	$router->addRoute(array(
		'path' => URL_PREFIX . '/products/{product_id}',
		'handlers' => array('product_id' => Zaphpa_Constants::PATTERN_DIGIT),
		'get' => array('GatewayInterface', 'getProducts')
	));


	$router->addRoute(array(
		'path' => URL_PREFIX . '/test',
		'get' => array('GatewayInterface', 'test')
	));

	try { $router->route(); }
	catch (Zaphpa_InvalidPathException $ex) {
		header("Content-Type: text/plain", TRUE, 404);
		die('Invalid URL');
	}

?>