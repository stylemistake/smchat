<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Chat extends CI_Controller {



	// ----------------------------  Private stuff ----------------------------

	private function throw_error( $data, $message = "Generic error" ) {
		$data["status"] = "error";
		$data["message"] = $message;
		die( json_encode( $data ) );
	}

	private function throw_success( $data, $message = "Success!" ) {
		$data["status"] = "success";
		$data["message"] = $message;
		die( json_encode( $data ) );
	}

	private function load_index_data() {
		$data['title'] = "Chat";
		$data['subtitle'] = $_SERVER['SERVER_NAME'];
		$data['base_url'] = $this->config->item('base_url');
		$data['messages'] = $this->message->get();
		$data['userdata'] = $this->user->get_user_data();
		if( empty($data['userdata']['loggedin']) ) $data['userdata']['loggedin'] = false;
		return $data;
	}

	private function load_json_default_data() {
		return array(
			"status" => "unknown",
			"message" => "nothing has happened"
		);
	}



	// ----------------------------  Public stuff ----------------------------

	public function index() {
		$e = isset( $_GET['embedded'] );
		$this->load->model('user');
		$this->load->model('message');
		$data = $this->load_index_data();

		$this->load->view( 'prepage', $data );
		$this->load->view( 'header', $data );
		$this->load->view( 'chatlog', $data );
		$this->load->view( 'online' );
		$this->load->view( 'messagebox', $data );
		$this->load->view( 'postpage' );
	}

	public function login() {
		$this->load->model('user');
		$this->load->model('message');

		$username = $this->input->post('username');
		$password = $this->input->post('password');
		$data = $this->load_json_default_data();

		if ( strlen($username) == 0 || strlen($password) == 0 ) {
			$this->throw_error( $data, "Some fields are empty.");
		}
		if ( !$this->user->check_username($username) ) {
			$this->throw_error( $data, "Username is invalid!" );
		}
		if ( !$this->user->login($username, $password) ) {
			$this->throw_error( $data, "Wrong username or password" );
		}

		$this->throw_success( $data, "Logged in successfully!" );
	}

	public function logout() {
		$this->load->model('user');

		$data = $this->load_json_default_data();

		$this->user->logout();
		$this->throw_success( $data, "Logged out successfully!" );
	}

	public function register() {
		$this->load->model('user');

		$data = $this->load_json_default_data();

		$username = $this->input->post('username');
		$password1 = $this->input->post('password1');
		$password2 = $this->input->post('password2');

		if ( strlen($username) == 0 || strlen($password1) == 0 ) {
			$data["field"] = "username";
			$this->throw_error( $data, "Some fields are empty.");
		}
		if ( !$this->user->check_username($username) ) {
			$data["field"] = "username";
			$this->throw_error( $data, "Username is invalid!" );
		}
		if ( !$this->user->check_username_vacancy($username) ) {
			$data["field"] = "username";
			$this->throw_error( $data, "Username is already in use!" );
		}
		if ( !$this->user->check_password($password1) ) {
			$data["field"] = "password1";
			$this->throw_error( $data, "Password is too short/long" );
		}
		if ( !$this->user->check_passwords_compare($password1, $password2) ) {
			$data["field"] = "password2";
			$this->throw_error( $data, "Password are not the same! Please re-enter the password." );
		}

		if ( $this->user->register( $username, $password1 ) ) {
			$this->throw_success( $data, "Successfully registered!" );
		} else {
			$this->throw_error( $data, "Registration failed" );
		}
	}

	public function post() {
		$this->load->model('user');
		$this->load->model('message');

		$message = $this->input->post('message');
		$data = $this->load_json_default_data();
		$userdata = $this->user->get_user_data();
		if ( empty($userdata['loggedin']) ) $userdata['loggedin'] = false;
		if ( !$userdata['loggedin'] ) {
			$this->throw_error( $data, "You are not logged in!" );
		}
		if ( !$this->message->check_post( $message ) ) {
			$this->throw_error( $data, "Please, enter text before sending!" );
		}
		$this->message->post( $userdata["username"], $message );
		$this->throw_success( $data, "Successfully posted!" );
	}

	public function get() {
		$this->load->model('message');
		$this->load->model('user');

		$type = $this->input->get('type');
		$data = $this->load_json_default_data();
		$this->user->check_in(); // Check in on post update

		if ( $type == "list" ) {
			$size = $this->input->get('size');
			if ( !is_numeric($size) ) $this->throw_error( $data, "Invalid list size" );
			$data["result"] = $this->message->get_list( $size );
			$this->throw_success( $data, "Done!");
		}
		if ( $type == "multi" ) {
			$id = $this->input->get('id');
			if ( empty($id) || !preg_match("/[0-9,]*/", $id) ) {
				$this->throw_error( $data, "Invalid post ID or CSV");
			}
			if ( is_numeric($id) ) {
				$data["result"] = $this->message->get_single( $id );
			} else {
				$id = explode( ",", $id );
				$data["result"] = $this->message->get_multi( $id );
			}
			$this->throw_success( $data, "Done!");
		}

		$this->throw_error( $data, "Missing type of query");
	}

	public function user() {
		$this->load->model('user');

		$type = $this->input->get('type');
		$data = $this->load_json_default_data();

		if ( $type == "me" ) {
			$userdata = $this->user->get_user_data();
			if ( $userdata == false ) $this->throw_error( $data, "You were deleted!" );
			$data["result"]["id"] = $userdata["id"];
			$data["result"]["username"] = $userdata["username"];
			$data["result"]["loggedin"] = $userdata["loggedin"];
			$data["result"]["role"] = $userdata["role"];
			$this->throw_success( $data, "Done!" );
		}

		$this->throw_error( $data, "Missing type of query");
	}

	public function online() {
		$this->load->model('user');
		$data = $this->load_json_default_data();
		$data["result"] = $this->user->get_online();
		$this->throw_success( $data, "Done!" );
	}

	public function edit() {
		$this->load->model('user');
		$this->load->model('message');

		$data = $this->load_json_default_data();
		$userdata = $this->user->get_user_data();

		if ( $userdata["role"] < 2 ) {
			$this->throw_error( $data, "Not an administrator!" );
		}

		$id = $this->input->get('id');
		$message = $this->input->get('message');

		if ( !is_numeric( $id ) ) $this->throw_error( $data, "Bad ID format" );
		if ( strlen( $message ) < 2 ) $this->throw_error( $data, "Message doesn't present or too short" );

		$this->message->edit( $id, $message );
		$this->throw_success( $data, "Post #$id was edited" );
	}

	public function delete() {
		$this->load->model('user');
		$this->load->model('message');

		$type = $this->input->get('type');
		$data = $this->load_json_default_data();
		$userdata = $this->user->get_user_data();

		if ( $userdata["role"] < 2 ) {
			$this->throw_error( $data, "Not an administrator!" );
		}
		if ( $type == "post" ) {
			$id = $this->input->get('id');
			if ( !is_numeric( $id ) ) $this->throw_error( $data, "Bad ID format" );
			$this->message->delete( $id );
			$this->throw_success( $data, "Post #$id was deleted" );
		}
		if ( $type == "user" ) {
			$id = $this->input->get('id');
			if ( !is_numeric( $id ) ) $this->throw_error( $data, "Bad ID format" );
			$this->user->delete( $id );
			$this->throw_success( $data, "User #$id was deleted" );
		}

		$this->throw_error( $data, "Missing type of query" );
	}
}

?>