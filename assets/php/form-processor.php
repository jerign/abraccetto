<?php

	$error = '';

	if ( array_key_exists('to', $_POST) ){
	   
		$to 		= "contact@abraccettoparis.com"; 	
		$from		= "user@domain.com";
		$name		= "Website User";
		$subject	= "Nouvelle prise de contact venant du site web";
		$message	= "";


		if(isset($_POST['from'])){
			$from 	= $_POST['from']; 	
			unset($_POST['from']); 
		}

		if(isset($_POST['name'])){ 
			$name 	= $_POST['name'];
			unset($_POST['name']); 
		}

		if(isset($_POST['subject'])){ 
			$subject	= $_POST['subject']; 

			if($subject == "Evénementiel - Groupes"){
				$to = "event@abraccettoparis.com"; 	
			}
			if($subject == "Recrutement"){
				$to = "recrutement.abraccetto@outlook.com"; 	
			}	

			unset($_POST['subject']); 
			unset($_POST['to']);
		}


		foreach ($_POST as $field => $data){

	   		$message = "<html><head><title> $subject</title></head><body>\n";
	   		foreach($_POST as $field => $data){	            
	   			$message .= "<div style='border-bottom:1px solid #dadada; padding-bottom:15px;margin-bottom:15px;'><br/>".stripslashes($data)."</div>\n";
	   		}
	   		$message .= "</body></html>";

		}


		// To send HTML mail, the Content-type header must be set
		define('HEADER_TRAIL', "\r\n");
	   	$headers  = 'MIME-Version: 1.0' . HEADER_TRAIL;
	   	$headers .= ( ! EMAIL_HTML) ? 'Content-type: text;' . HEADER_TRAIL : 'Content-type: text/html; charset=UTF-8' . HEADER_TRAIL ;

	   	// Additional headers
	   	$headers .= "From: ".$name." <".$from.">" . HEADER_TRAIL;


	   	if(!mail($to, $subject, $message, $headers)){
	   		$error = 
	   		'<div class="alert alert-danger alert-dismissible fade show" role="alert">
				<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				Error sending message. Please try again.
			</div>';
	   	}



	} else {
		$error = 
		'<div class="alert alert-danger alert-dismissible fade show" role="alert">
			<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			There is no <strong> "to" </strong> field found in the form. Please follow the documentation.
		</div>';
	}


	if(!empty($error) ){
		echo $error;
	}
	else{
		echo 
		'<div class="alert alert-success alert-dismissible fade show" role="alert">
			<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			Your message has been sent successfully.
		</div>';
	}


?>
