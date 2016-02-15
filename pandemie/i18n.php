<?php
	/* Recup les infos de la requete, recherche le fichier locale*/
	$locale = NULL;
	$date = NULL;
	$lang_folder = "langs";
	$lang_file = "res.json";
	
	if (array_key_exists("locale",$_GET)) $locale = $_GET["locale"];
	else {
		//pas de contenu!
		header('HTTP/1.0 204 No Content');
		exit;

	}
	if (array_key_exists("date",$_GET))$date = $_GET["date"];	
	
	//recherche le fichier demandé
	$folders = explode('-',$locale);
	$main_lang = $lang_folder."/".strtoupper($folders[0]);
	
	
	if (is_dir($main_lang)){
		//verifie si a une locale plus precise
		if (count($folders)>1){
			//idem pour le dessous
			$precise = $main_lang."/".strtoupper($folders[1]);
			
			if(is_dir($precise) && file_exists($precise."/".$lang_file)){
				//verifie la date de validité
				$precise = $precise."/".$lang_file;
				
				if( $date == null || filemtime($precise) > strtotime($date)){
					header('Location: '.$precise);
				}
				else {
					// "pas de modif!";
					header ('HTTP/1.0 403 no modif');
				}
				exit;
			}
			
		}
		
		
		$main_lang = $main_lang."/".$lang_file;
		if (file_exists($main_lang)){
			//verifie la date de modification
			if( $date == null || filemtime($main_lang) < strtotime($date)){
				header('Location: '.$main_lang);
			}
			else {
				// "pas de modif!";
				header ('HTTP/1.0 403 no modif');
			}
			
			exit;
		}
		
		
	} 
	
	header('HTTP/1.0 204 unsupported lang');
	
	
?>


