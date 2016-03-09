//--require ftw2 --namespace utilities

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  utils.js: 
        quelques méthodes utilitaires pour le framework, a defaut de les placer ailleurs
        
*/

//pour stocker la date crée lors de  la generation d'un UUID
//je me demande si on peut faire autrement qu'un global comme ca...
//@private
var __uuid_date = null;


//Genere un UUID unique pour chaque objet qui doit etre lier
//@return string: l'UUID généré
//@public
function generateUUID() {
    __uuid_date = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, __replace_uuid);
};

//une methode interne pour la generation
//appellé pour chaque charactere de l'UUID
//@param c: le charactere a etudier
//@return le charactere généré
//@private
function __replace_uuid(c){
        var d = __uuid_date;
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
}


//Recupere le path vers l'element visé
//@param elem: l'element html visé
//@param root: l'element root a partir duquel chercher (racine si null)
//@return path: le chemin d'acces a l'element, style CSS selector
//@public
function getDomPath(elem, root) {

	//si root = null, a partir de la racine
	var el = elem;
	if (!el) {
		return;
	}


        var stack = [];

        while (el != root && el.parentNode != null) {
            //si a un id, utilise le

            if ( el.hasAttribute('id') && el.id != '' ) {
                stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
            } else {
                    
		var sibCount = 0;//nbr de siblings (de meme nom de tag)
		var sibIndex = 0;//index de l'element parmis les siblings
		var nodeName = el.nodeName;
                var length = el.parentNode.childNodes.length;
                var childs = el.parentNode.childNodes;
                
		for ( var i = 0; i < length; i++ ) {
		  var sib = childs[i];
		  if ( sib.nodeName == nodeName ) {
			if ( sib === el ) {
			  sibIndex = sibCount;
			  break;
			}
			sibCount++;
		  }
		}


		if ( sibIndex >0 ) {
		  stack.unshift(nodeName + ':nth-of-type(' + (sibIndex+1) + ')');
		} else {
		  stack.unshift(nodeName);
		}

        }
	el = el.parentNode;

  }
  
  return stack.join(' > ');
}


//une méthode converter pour les radios values (pour un input binding)
//@param value: la valeur actuelle du binding
//@param params: la valeur aquelle comparer le value
//@return true si value==params sinon false, null si value==null (pour les fallbacks)
//@public global
function check_radio_value(value, params){
        return value ? value == params : null;
}
//converter: verifie si une valeur est true/false
//@param value: la valeur a veriier
//@param params: un tableau de 2 valeurs possibles si false=>0, true=>1 
//@return true/false ou params[0] si false, params[1] si true
function is_true (value, params){
      var res = value == true;
      if (params && params.length >= 2) {
              res = res? params[1] : params[0];
      }
      return res;
}


function ftw2_getLocale(){
         if (navigator.languages != undefined) return navigator.languages[0]; 
         else return navigator.language;
}
//localize un nombre pour affichage
//@params value: le nombre a localizer
//@params params: parametres optionels
//      1: locale: une chaine decrivant la langue a utiliser (defaut: navigator.languages[0])
//      0: after_dot_count: le nombre de chiffres apres la virgule (defaut: 2)
//@return string: le nombre localisé
function localize_number (value, params){
  //remplace le point par une virgule
  if (value == null) return "";
  after = 2;
  locale = ftw2_getLocale();
  if(params){
        after = params[0] || 2;
        locale = params[1] || locale;
  }
  
  return  value.toLocaleString("fr-FR",{maximumFractionDigits:after, minimumFractionDigits:after});

}
//helper methode, retire les '' d'une propriete
//@temp en attendant de faire mieux pour la regex
//@param value: la string a deshabiller
//@return: la string sans les quotes
//@public
function __unstringify(value){
        
    if (value!=null && value[0]=="'" && value[value.length-1]=="'"){
        //un tableau de parametres
        value = value.substring(1, value.length-1);
    }
    return value;
}




//ajoute un listener pour un event
//@param elem: l'element html qui va recevoir l'ecouteur
//@param a: l'event a ecouter
//@param b: la fonction a appeller lors de l'event
/*
function addCommandListener(elem,a,b){
        elem.addEventListener(a,b);//event, function

        //supprimer ca....                      ==============================================> TODO
	/*if(!elem.eventListenerList) elem.eventListenerList = {};
	if(!elem.eventListenerList[a]) elem.eventListenerList[a] = [];
	elem.eventListenerList[a].push(b);*
}*/

//Supprime un node enfant d'un element html, en profite pour
//supprimer les listeners d'events
//@param elem: l'element parent
//@param child: l'element a supprimer
function removeChildAndClearEvents(elem, child){
        elem.removeChild(child);
	//clear_events(child);
}

//supprime les ecouteurs d'events des elements html
//@DEPRECATED
//@param child: l'element a qui supprimer les ecouteurs (lui et ses enfants)
function clear_events (child){
    //uniqument pour lui ou aussi pour les inners????
	if(child.eventListenerList){
                var events = null;
                var j=0;
		for (key in child.eventListenerList){
				events = child.eventListenerList[key];
                                j = events.length;
                                while (j--){
					child.removeEventListener(key,events[j] );
                                        
                                        if(child._input_binding)child._input_binding=null;
                                        if(child._cmd_binding)child._cmd_binding=null;
				}
			}
	}
	if(child.children){
		//parcours les elements pour virer les events
                var elem = null;
                var ci = child.children.length;
                while(ci--){
			elem = child.children[ci];
			clear_events(elem);
		}

	}
}
   
   

