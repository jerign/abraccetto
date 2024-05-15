<?php

	$error = '';

	if ( array_key_exists('to', $_POST) ){
	   
		$to 		= "event@abraccettoparis.com"; 	
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
		if(isset($_POST['ets'])){ 
			$ets 	= $_POST['ets'];
			unset($_POST['ets']); 
		}
		if(isset($_POST['phone'])){ 
			$phone 	= $_POST['phone'];
			unset($_POST['phone']); 
		}
		if(isset($_POST['date'])){ 
			$date 	= $_POST['date'];
			unset($_POST['date']); 
		}

		if(isset($_POST['subject'])){ 
			$subject	= $_POST['subject']; 

			unset($_POST['subject']); 
			unset($_POST['to']);
		}


		

		$message = "<html><head><title> $subject</title></head><body>\n";
		$message .="<div> Nom : ".stripslashes($name)."</div> <br/>\n";
		$message .="<div> Entreprise : ".stripslashes($ets)."</div> <br/>\n";
		$message .="<div> Telephone : ".stripslashes($phone)."</div> <br/>\n";
		$message .="<div> Email : ".stripslashes($from)."</div> <br/>\n";
		$message .="<div> Type d'evenement : ".stripslashes($subject)."</div> <br/>\n";
		$message .="<div> Date : ".stripslashes($date)."</div> <br/>\n";        
		$message .= "<div> Message : ".stripslashes($content)."</div> <br/>\n";

		$message .= "</body></html>";




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
