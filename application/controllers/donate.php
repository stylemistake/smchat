<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Donate extends CI_Controller {

	public function index() {
		$this->load->model('user');
		$this->load->model('message');
		$data = array(
			"back" => $this->input->get('back'),
		);

		$this->load->view( 'donate', $data );
	}

}

?>