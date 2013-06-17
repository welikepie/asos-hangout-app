<?php

	define('CLIENT_ID', '1035480721184.apps.googleusercontent.com');
	define('CLIENT_SECRET', 'dHkpmVxvQjRYk20K2YNOHOaO');

	function build_url ($base, $params) {
		$url = array();
		foreach ($params as $key => &$value) { $url[] = urlencode($key) . '=' . urlencode($value); }
		$url = implode('&', $url); if (strlen($base) && strlen($url)) { $url = '?' . $url; }
		return $base . $url;
	}
	function local_url () {
		$protocol = "http" . (isset($_SERVER['HTTPS']) ? 's' : '');
		$port = $_SERVER['SERVER_PORT'];
		if (
			($port === '80' && $protocol === 'http') ||
			($port === '443' && $protocol === 'https')
		) { $port = ''; } else { $port = ':' . $port; }
		return "{$protocol}://{$_SERVER['HTTP_HOST']}{$port}{$_SERVER['PHP_SELF']}";
	}

	session_start();
	$user_data = isset($_SESSION['user_data']) ? $_SESSION['user_data'] : array(
		'access_token' => null,
		'token_expiry' => time(),

		'id' => null,
		'name' => null,
		'avatar' => null,
		'url' => null
	);

	// If receiving the code param in querystring,
	// we're in the process of going through OAuth process
	// for retrieving the G+ user ID, as well as general details.
	if (isset($_GET['code'])) {

		$params = array(
			'code' => $_GET['code'],
			'client_id' => CLIENT_ID,
			'client_secret' => CLIENT_SECRET,
			'redirect_uri' => local_url(),
			'grant_type' => 'authorization_code'
		);

		$curl = curl_init();
		curl_setopt_array($curl, array(
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_SSLVERSION => 3,
			CURLOPT_POSTFIELDS => build_url('', $params),
			CURLOPT_URL => 'https://accounts.google.com/o/oauth2/token'
		));

		$data = json_decode(curl_exec($curl), true);
		curl_close($curl); unset($curl);

		$user_data['access_token'] = $data['access_token'];
		$user_data['token_expiry'] = time() + $data['expires_in'];
		$user_data['id'] = null;
		unset($data);

	}

	// Should be just start the procedure,
	// obtain the access token to the API.
	if (!$user_data['access_token'] || ($user_data['token_expiry'] < time())) {

		$params = array(
			'response_type' => 'code',
			'client_id' => CLIENT_ID,
			'redirect_uri' => local_url(),
			'scope' => 'https://www.googleapis.com/auth/plus.login'
		);
		
		header('HTTP/1.1 307 Temporary Redirect', true, 307);
		header('Location: ' . build_url('https://accounts.google.com/o/oauth2/auth', $params));
		exit();

	}

	// If the token is present,
	// but not the user details, we can retrieve those now
	if (!$user_data['id']) {

		$curl = curl_init();
		curl_setopt_array($curl, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_SSLVERSION => 3,
			CURLOPT_URL => 'https://www.googleapis.com/plus/v1/people/me',
			CURLOPT_HTTPHEADER => array('Authorization: Bearer ' . $user_data['access_token'])
		));

		$data = json_decode(curl_exec($curl), true);
		curl_close($curl); unset($curl);

		$user_data['id'] = $data['id'];
		$user_data['url'] = $data['url'];
		$user_data['name'] = $data['displayName'];
		if (isset($data['image']) && isset($data['image']['url'])) {
			$user_data['avatar'] = preg_replace('/\?sz=[0-9]+$/', '?sz=300', $data['image']['url']);
		}

	}
	$_SESSION['user_data'] = $user_data;

	// Once the sufficient user data has been collected off the Google+ API,
	// let us attempt to add the user into the audience queue.
	$user = $user_data;
	$user['state'] = 0; // WAITING
	unset($user['access_token']);
	unset($user['token_expiry']);

	$curl = curl_init();
	curl_setopt_array($curl, array(
		CURLOPT_RETURNTRANSFER => false,
		CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		CURLOPT_URL => '<%= pkg.app.nodeUrl %>audience-queue',
		CURLOPT_POSTFIELDS => str_replace('\/', '/', json_encode($user))
	));

	curl_exec($curl);
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	curl_close($curl); unset($curl);

	$url = str_replace('join.php', '', local_url());
	if ($code === '403') { $url .= '?present'; }

	header('HTTP/1.1 307 Temporary Redirect', true, 307);
	header('Location: ' . $url);

?>