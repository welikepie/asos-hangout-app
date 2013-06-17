<?php

	if (function_exists("apache_request_headers")) {
		$headers = apache_request_headers();
		if (isset($headers['Authorization'])) { $token = $headers['Authorization']; }
		else { $token = null; }
	}
	elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { $token = $_SERVER['HTTP_AUTHORIZATION']; }
	else { $token = null; }

	header('HTTP/1.1 200 OK', true, 200);
	header('Content-Type: text/javascript');
	echo('window.authToken = ' . json_encode($token) . ';');

?>