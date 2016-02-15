/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <stephane.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------
*/
/*
modification : control fin des models/array

TODO: probleme de passaeg screen mobile-> desktop et historic/fragment
	qd fera la lib pour le cloud, devra regler ca...

    fragment/page: chargement depuis une URL
    i18n: mieux integrer ca....
    Models: local et global
    fragment a charger: mettre le js necessaire dans la page a charger?
    array: gestion fine
    UI

    
Optimisations:
	1: documentFragment: eviter les reflows
*/

var HISTORY = []; //dictionnaire d'ids de pages deja visit�s
var CURRENT_PAGE = null;//id de la page actuellement affich�e
var CONTEXT = null;

var BINDINGS = { __global__ : {} };//dictionnaire associant cl� de binding a liste d'elements a prevenir
var MODELS = {};//des binding models a ajouter/supprimer des pages
var SCREEN = "desktop";//le type d'affichage a utiliser, par defaut, la vue 'grande'  mobile | tablet | desktop
// METHODES UTILITAIRES ------------------------------------------------------------------------------------------------------
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}
function supportsWebStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}
testUserAgent = function (ua) {
			// smart tv
	return  ua.match(/GoogleTV|SmartTV|Internet.TV|NetCast|NETTV|AppleTV|boxee|Kylo|Roku|DLNADOC|CE\-HTML/i) ? 'tv'
			// tv-based gaming console
		  : ua.match(/Xbox|PLAYSTATION.3|Wii/i) ? 'tv'
			// tablet
		  : ua.match(/iPad/i) || ua.match(/tablet/i) && !ua.match(/RX-34/i) || ua.match(/FOLIO/i) ? 'tablet'
			// android tablet
		  : ua.match(/Linux/i) && ua.match(/Android/i) && !ua.match(/Fennec|mobi|HTC.Magic|HTCX06HT|Nexus.One|SC-02B|fone.945/i) ? 'tablet'
			// Kindle or Kindle Fire
		  : ua.match(/Kindle/i) || ua.match(/Mac.OS/i) && ua.match(/Silk/i) ? 'tablet'
			// pre Android 3.0 Tablet
		  : ua.match(/GT-P10|SC-01C|SHW-M180S|SGH-T849|SCH-I800|SHW-M180L|SPH-P100|SGH-I987|zt180|HTC(.Flyer|\_Flyer)|Sprint.ATP51|ViewPad7|pandigital(sprnova|nova)|Ideos.S7|Dell.Streak.7|Advent.Vega|A101IT|A70BHT|MID7015|Next2|nook/i) || ua.match(/MB511/i) && ua.match(/RUTEM/i) ? 'tablet'
			// unique Mobile User Agent
		  : ua.match(/BOLT|Fennec|Iris|Maemo|Minimo|Mobi|mowser|NetFront|Novarra|Prism|RX-34|Skyfire|Tear|XV6875|XV6975|Google.Wireless.Transcoder/i) ? 'mobile'
			// odd Opera User Agent - http://goo.gl/nK90K
		  : ua.match(/Opera/i) && ua.match(/Windows.NT.5/i) && ua.match(/HTC|Xda|Mini|Vario|SAMSUNG\-GT\-i8000|SAMSUNG\-SGH\-i9/i) ? 'mobile'
			// Windows Desktop
		  : ua.match(/Windows.(NT|XP|ME|9)/) && !ua.match(/Phone/i) || ua.match(/Win(9|.9|NT)/i) ? 'desktop'
			// Mac Desktop
		  : ua.match(/Macintosh|PowerPC/i) && !ua.match(/Silk/i) ? 'desktop'
			// Linux Desktop
		  : ua.match(/Linux/i) && ua.match(/X11/i) ? 'desktop'
			// Solaris, SunOS, BSD Desktop
		  : ua.match(/Solaris|SunOS|BSD/i) ? 'desktop'
			// Desktop BOT/Crawler/Spider
		  : ua.match(/Bot|Crawler|Spider|Yahoo|ia_archiver|Covario-IDS|findlinks|DataparkSearch|larbin|Mediapartners-Google|NG-Search|Snappy|Teoma|Jeeves|TinEye/i) && !ua.match(/Mobile/i) ? 'desktop'
			// assume it is a Mobile Device (mobile-first)
		  : 'mobile'
  }
//surcharge pour les tests
testUserAgent = function(ua){
	//fait en fonction de la taille de l'ecran
	width = window.innerWidth;
	////("taille document: "+width);
	return width < 500 ? "mobile" : width <800 ? "tablet" : "desktop";
}
function getBaseUrl() {
	var re = new RegExp(/^.*\//);
	return re.exec(window.location.href);
}
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

/*
Recupere le path vers l'element visé
	@param elem: l'element html visé
	@param root: l'element root a partir duquel cherché
	@return path: le chemin d'acces a l'element, style CSS selector
*/
function getDomPath(elem, root) {

	//si root = null, a partir de la racine
	el = elem;
	if (!el) {
		return;
	}


  var stack = [];

  while (el != root && el.parentNode != null) {
    //si a un id, utilise le

	if ( el.hasAttribute('id') && el.id != '' ) {
      stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
    } else {
		////("searching sibling");
		var sibCount = 0;//nbr de siblings (de meme nom de tag)
		var sibIndex = 0;//index de l'element parmis les siblings
		nodeName = el.nodeName;
		for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
		  var sib = el.parentNode.childNodes[i];
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

//surcharge qqs methodes de array pour etr prevenu des push, slice...
DBArray = {};

DBArray.__proto__ = new Array();
DBArray.push = function(){

    //ajoute a l'array
    Array.prototype.push.apply(this,arguments);

    //previens les owners
    extra = {action:'PUSH', value: arguments.length};//le nombre de datas ajoutés: voir plus tard...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged){
                //DOIT INFORMER DE CE QU'IL DOIT FAIRE: ie AJOUT A LA FIN
                ow[0].notifyDatasetChanged(ow[1],extra);
            }
        }
    }

};
DBArray.splice = function(){

    Array.prototype.splice.apply(this,arguments);
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1]);
        }
    }
};
DBArray.pop = function(){
    old = this[this.length-1].__uuid__;
    p = Array.prototype.pop(this,arguments);
    extra = {action:'POP', value:old}
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1]);
        }
    }
    return p;
};
DBArray.shift = function(){

    p = Array.prototype.splice.shift(this,arguments);
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1]);
        }
    }
    return p;
};
DBArray.unshift = function(){

    p = Array.prototype.splice.unshift(this,arguments);
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1]);
        }
    }
    return p;//la nouvelle longueur du tableau
};
//overribe bracket setter? voir avec les proxies

DBArray.set = function (obj, index){
    //modifie l'item a l'index
    //NOTE: on pourrai creer des property pour chaque element de l'array
    //mais si il y en a beaucoup????
    old = this[index].__uuid__;

    this[index] = obj;
    extra = {action:'SET', value: old, index: index};//uuid de l'objet a supprimer...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
}


//permet de creer le necessaire pour la liaison de donnée  (ie: property et notify)
//@param obj: le plain object javascript a rendre 'bindable'
defineBindObject = function(obj){
    if (obj == null) return;
    is_array = false;

    if (obj.hasOwnProperty('__uuid__') !== true){
        if (Array.isArray(obj) && ""+Object.prototype.toString.call(obj)!="[object String]"){
            is_array = true;
        }

        else if (""+Object.prototype.toString.call(obj)!="[object Object]") {

    		return;//deja fait
    	}
    } else return;


	//cree la property de marquage
	uuid = generateUUID();

	Object.defineProperty(obj, '__uuid__',{value:uuid , enumerable: false, writable:false});//????? avec le in, pe un probleme?
	Object.defineProperty(obj, 'notifyDatasetChanged',{value: function(name, extra){
		key = this.__uuid__+":"+name;//pour identifier l'objet...
		notifyDatasetChanged(key,extra);
	}, enumerable: false, writable:false});
	//defini des  owners pour l'objet EXPERIMENTAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	Object.defineProperty(obj, "__owners__",{value:[], enumerable:false, modifiable:true});
	//ajoute, supprime un owners
	obj.AddToOwners = function(owner, prop_name){
		this.__owners__.push( [owner, prop_name]);//ajoute a la liste
	};
	obj.RemoveFormOwners = function(owner, prop_name){
		if (this.__owners__){
			for (owi=0;owi<this.__owners__.length; owi++){
				ow = this.__owners__[owi];
				if (ow[0] == owner && ow[1]==prop_name){
					this.__owners__.slice(owi,1);//supprime
					break;//fini
				}
			}
		}
	};

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    //si array, binde de facon particuliere
    if (is_array){
        //("ArrayBinding data: particulier");
        obj.__proto__ = DBArray;//change le prototype!

        return;
    }
    else {
        //un objet normal, binde les property

        for (obj_k in obj){
    		if (typeof obj[obj_k] == "function" || obj_k.substr(0,1) == '_')continue;


    		//cree le binding, ie, cree une nouvelle property pour l'objet
    		//non enumerable
            old = obj[obj_k];

    		Object.defineProperty(obj, "__"+obj_k,{
    			value : obj[obj_k],
    			enumerable:false,
    			writable:true
    		});

    		//change la property pour mettre en place le notifydatasetchanged
    		//cree une cl� de la forme className_propName

    		//probleme prop_key change, probleme closure
    		__define_property(obj, obj_k);

			//(obj);

           //Si une valeur, binde la valeur
            if(obj[obj_k]!= undefined){
			//("binding de "+obj_k);
                defineBindObject(obj[obj_k]);
                if (obj[obj_k].AddToOwners)  obj[obj_k].AddToOwners(obj, obj_k);
            }
    	}
    }


}
//definie une property pour un objet a lier
//INTERNAL
//@param obj: l'instance de l'objet a lier
//@param obj_k: nom de la property a lier
function __define_property(obj, obj_k){
	Object.defineProperty(obj,obj_k,{
			get : function(){
				return this["__"+obj_k];
			},
			set : function(value){

                //experimental !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                var old = this["__"+obj_k];
                if (value != null ) defineBindObject(value);


                if (old != null && old.RemoveFromOwners) old.RemoveFromOwners(this,obj_k);
                if (value!= null && value.AddToOwners) value.AddToOwners(this, obj_k);
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                console.log("Change: ");
                console.log(value)
				this["__"+obj_k] = value;
				//passe l'UUID de l'objet pour retrouver avec la cl�
				//note, context itou?
				//notifyDatasetChanged(this.__uuid__+":"+obj_k);
				key = this.__uuid__+":"+obj_k;
                console.log("recherche cle de binding: "+key)
				if (key in BINDINGS[CURRENT_PAGE]) {
					console.log("OK");

					__notifyDatasetChanged(this,BINDINGS[CURRENT_PAGE][key], key);
				}
			}
		});
}

//modifie un peu le html pour gerer les listes d'events
HTMLElement.prototype._addEventListener = HTMLElement.prototype.addEventListener
//Ajoute un ecouteur d'event a l'element html
//@param a: le nom de l'event a ecouter (ex: load, change...)
//@param b: la methode a executer
HTMLElement.prototype.addEventListener = function(a,b,c) {
   
    this._addEventListener(a,b,c);//event, function

	if(!this.eventListenerList) this.eventListenerList = {};
	if(!this.eventListenerList[a]) this.eventListenerList[a] = [];
	this.eventListenerList[a].push(b);
};

HTMLElement.prototype._removeChild = HTMLElement.prototype.removeChild;
//supprime un element, en profite pour supprimer les ecouteurs d'events
//@param child: l'element enfant a supprimer
HTMLElement.prototype.removeChild = function(child){

	this._removeChild(child);
    //("removing child ");
	clear_events(child);
}
//supprime les ecouteurs d'events des elements html
//@param child: l'element a qui supprimer les ecouteurs (lui et ses enfants)
function clear_events (child){
    //uniqument pour lui ou aussi pour les inners????
	if(child.eventListenerList){

		for (key in child.eventListenerList){
				events = child.eventListenerList[key];
				for(j=0;j<events.length; j++){
					child.removeEventListener(key,events[j] );
				}
			}
	}
	if(child.children){
		//parcours les elements pour virer les events
		for(var ci=0;ci < child.children.length;ci++){
			var elem = child.children[ci];
			clear_events(elem);
		}

	}
}
// GESTION NAVIGATION ET HISTORIQUE -------------------------------------------------------------------------------------------

function clearHistory(){
	HISTORY = [];

	h_key = CONTEXT.app_name == null ? "default_app_history" : CONTEXT.app_name+"_history";
	localStorage.removeItem(h_key);
}

//un bean pour contenir les infos de l'historique et un stack pour eviter
//d'en creer a foison...
function History( id, datas){
	this._id = id;//ide du div
	this._datas = datas;//un objet contenant les donn�es a sauvegarder
}
var __HISTORY_STACK = [] //pour pas en recreer des inutiles
function obtain(id, dt){
	h = null;
	if(__HISTORY_STACK.length > 0){
		h = __HISTORY_STACK.pop(0);
		h._id = id;
		h._datas=dt;
	}
	else{
		h = new History(id, dt);
	}
	return h;
}
function recycle(h){
	h._id = -1;
	h._datas = null;
	__HISTORY_STACK.push(h);
}


/* permet de naviguer entre les pages de l'application
@param id: id de la page a afficher, si null, recupere dans l'historique*/
function navigateTo(id){

	hideActivePanel();
	hideActiveDialog()
        console.log("navigate to:"+id);
        console.log("current: "+CURRENT_PAGE)
	if (id != null && id == CURRENT_PAGE) return;

	var old = CURRENT_PAGE == null ? null : document.getElementById(CURRENT_PAGE);//ancienne

	var page = null; //nouvelle
	var page_id = id;
	var datas = null;//si pop de l'historique

	var save = (id != null);//si doit sauvegarder l'etat de la page?




	//ordre actions: on_unload on_save on_restore on_load
	if (old != null){
                        console.log("ancienne page, unload et save");
			//dechargement de la page, probleme si demande confirmation?
			for (i = 0; i< old._unload_delegate.length; i++){
				id = old._unload_delegate[i][0];
				delegate = old._unload_delegate[i][1];

                                console.log(delegate);
				if(CONTEXT[delegate]()=== false)
				{
					//navigation annul�e si un fragment refuse
					return;
				}
			}
			/*sv = old.getAttribute('data-onunload');//pas de retour ici, on quitte!
			(sv == null || !(sv in CONTEXT))? null : CONTEXT[sv]();//un plain object*/


		nohistory = old.getAttribute("data-nohistory");

		//enregistre l'etat actuel de la page
        //probleme, si doit telecharger la page/fragment...                                   TODO
		if (save && nohistory == null){
			dt={};//enregistrer id du fragment?
			for (i = 0; i< old._save_delegate.length; i++){
				id = old._save_delegate[i][0];
				delegate = old._save_delegate[i][1];
				dt[id] = CONTEXT[delegate]();
			}
			h = obtain(CURRENT_PAGE,dt );
			HISTORY.push(h);//ajoute a l'historique
		}


	}


	if (page_id == null ){
		//charge depuisl'historique
                console.log("Chargement depuis l'historique");
		pagedatas = HISTORY.pop();//recupere le dernier de la liste
                console.log(pagedatas);
                if(pagedatas){
		//charge le state si existe
			page = document.getElementById(pagedatas._id);
			page_id = pagedatas._id;
			datas = pagedatas._datas;

			if(page == null) return;

			//restoration a partie de l'historique
			//if (datas != null){


			for (i = 0; i< page._restore_delegate.length; i++){
				id = page._restore_delegate[i][0];
				delegate = page._restore_delegate[i][1];
				CONTEXT[delegate](datas[id]);//renvois les donn�es correspondant au fragment
			}


			recycle(pagedatas);

                        }
                else {
                        console.log("no datas!");
                        //demande a aller a la premiere page....                 ==> normalement, ca ne devrait jamais arrivé ca...
                }

	} else {
                console.log("navigate vers: "+page_id+","+id);
		page = document.getElementById(page_id);
                if(page == null) return;

                for (i = 0; i< page._restore_delegate.length; i++){
                        id = page._restore_delegate[i][0];
                        delegate = page._restore_delegate[i][1];
                        CONTEXT[delegate]();//renvois les donn�es correspondant au fragment
                }
                

	}
        
	//nouvelle page
	CURRENT_PAGE = page_id;
	//("navigate: page_id:"+page_id);

	//previens le binding
	notifyDatasetChanged();

	//load la page (event)
	for (i = 0; i< page._load_delegate.length; i++){
		id = page._load_delegate[i][0];
		delegate = page._load_delegate[i][1];
		////("calling load delegate:"+delegate);
		CONTEXT[delegate]();
	}
    //remet le scroll a zero
    window.scrollTo(1,0);

	//animation d'affichage: simple switch
	if (old){
		cn = old.className;
		old.className = cn.replace(" normal","");
	}
	page.addEventListener("animationend", function(evt){AnimationListener(evt,' fadeInRight'," normal");}, false);

	cn = page.className;
	page.className += " fadeInRight";
}

/*affichage/hide de dialog*/
function showDialog (id){
	//affiche un div boite de dialog au milieu de la page
	dlg = document.getElementById(id);
	if (dlg && dlg.className.indexOf("normal") == -1 ){//test aussi pour voir si pas deja affich�e!
		//load la dlg (event)
		sv = dlg.getAttribute('data-onload');
		//("calling dialog");
		(sv == null || !(sv in CONTEXT)) ? false : CONTEXT[sv](dlg);//un plain object

		dlg.addEventListener("animationend", function(evt){AnimationListener(evt,' simplefadeIn'," normal");}, false);
		dlg.className += " simplefadeIn";

	}
}
function hideActiveDialog(){
	dlg = document.querySelector(".normal[data-role=dialog]");
	if(dlg)_hideDialog(dlg)
}
function hideDialogId(id){

	dlg = document.getElementById(id);
	_hideDialog(dlg);
}
function hideDialog(id){ //reste pour des raisons historiques
	dlg = null;
	if (id instanceof String){
		//considere comme id
		dlg = document.getElementById(id);

	} else {
		//un element html?
		dlg = id;
	}
	_hideDialog(dlg);
}
function _hideDialog(dlg){
	if (dlg){
		//load la dlg (event)
		sv = dlg.getAttribute('data-onunload');
		(sv == null || !(sv in CONTEXT)) ? true : CONTEXT[sv]();//un plain object

		dlg.addEventListener("animationend", function(evt){AnimationListener(evt,' simplefadeOut',"");}, false);
		dlg.className =dlg.className.replace(" normal"," simplefadeOut");

	}
}

function showPanel (id){
        console.log("show panel "+id);
        pnl = document.getElementById(id);
        console.log(pnl.eventListenerList);
	document.getElementById(id).className += " activemenu ";
	//document.getElementById(CURRENT_PAGE).className += " active ";
}
function hideActivePanel(){
	dlg = document.querySelector(".activemenu[data-role=panel]");
	if(dlg)_hidePanel(dlg)
}
function hidePanel (id){
	//referme le panel ouvert si existe
	pnl = document.getElementById(id);
	_hidePanel (pnl);
}
function _hidePanel (pnl){
	//referme le panel ouvert si existe

	if (pnl){

		//blablabla
                console.log("close ");
                console.log(pnl);
		cn = pnl.className;
		pnl.className = cn.replace(" activemenu ", "");
		//cn = document.getElementById(CURRENT_PAGE).className;
		//document.getElementById(CURRENT_PAGE).className =cn.replace(" active ", "");


	}
}

function AnimationListener(evt, anim, next){
	evt.target.removeEventListener("animationend",AnimationListener);
	cn = evt.target.className;
	evt.target.className = cn.replace(anim,next);
}


function __decorate_widgets(wdgs,classe, close){
	//internal: permet d'ajouter un div a une dialogue ou panel
	//pour empecher les clics sur l'UI en dessous
	for (i =0;i<wdgs.length;i++){
		var dlg = wdgs[i];
		var container = document.createElement("div");
		container.className = classe;

		//ajoute tous les childs de la dialogue au nouveau div?
		while (dlg.childNodes.length > 0) {
			container.appendChild(dlg.childNodes[0]);
		}
		dlg.appendChild(container);
                
                
                //pourquoi ne met pas en place le listener dans les inners panels/dialogs?????
		if(!dlg.hasAttribute("data-modal")){
                        
			dlg.addEventListener("click", function(evt){
				//ferme le div
                                evt.stopPropagation();
                                console.log("closing:");
				close(evt.target);
			}, true);
		}
                else
                {
                        dlg.addEventListener("click",function(evt){console.log("stop propagation");evt.stopPropagation();}, true)
                }


	}
}

function AppInit(){
		//les initialisations
		ctx = document.body.getAttribute("data-context");
		if (ctx == null) throw "No context defined!" ;//on verra plus tard!

		CONTEXT = window[ctx];
		if (CONTEXT == null)throw "No context defined!" ;//on verra plus tard!
		//cree le necessaire pour le binding //////////////////////////////////////////////////// MODIFS 0.2b
		defineBindObject(CONTEXT);



		SCREEN = testUserAgent( window.navigator ? window.navigator.userAgent: 'Windows' );//parceque qd meme, il y en a beaucoups...

		//ajoute une property has_history pour la gestion du bouton retour
		//renvoie la classe necessaire
		Object.defineProperty(CONTEXT, "has_history",{
			get : function(){

				v = " invisible ";
				if (HISTORY.length > 0) v = " showing ";

				return v;
			},
			enumerable: false,
		});
        CONTEXT["__process_update"] = false;
    	Object.defineProperty(CONTEXT, "process_update",{
    		get : function(){
                return this.__process_update;
    		},
            set: function(value){
                if (this.__process_update != value){
                    this.__process_update = value;
                    key = this.__uuid__+":process_update";

                    if (key in BINDINGS[CURRENT_PAGE]) {

                        __notifyDatasetChanged(this,BINDINGS[CURRENT_PAGE][key], key);
                    }
                }


            },
    		enumerable: false,
    	});

        //end_init: si true, initialisations terminées
        //en theorie, modifié 1 seule fois dans l'appli...
        CONTEXT["__end_init"] = false;
    	Object.defineProperty(CONTEXT, "end_init",{
    		get : function(){
                return this.__end_init;
    		},
            set: function(value){
                if (this.__end_init != value){
                    this.__end_init = value;
                    key = this.__uuid__+":end_init";

                    if (key in BINDINGS[CURRENT_PAGE]) {
                        __notifyDatasetChanged(this,BINDINGS[CURRENT_PAGE][key], key);
                    }
                }


            },
    		enumerable: false,
    	});
		//creation des headers + boutons back
		headers = document.getElementsByTagName("header");
		//ajoute les boutons backs, bind la class invisible
		for (i = 0; i<headers.length; i++){
			header = headers[i];
			bck = document.createElement("a");
			bck.setAttribute("href","#BACK");
			bck.setAttribute("data-binded-class","ui-btn ui-btn-round ui-btn-notext ui-icon-back {binding from:has_history}");
			bck.textContent = "back";
			header.insertBefore(bck, header.firstChild);
		}

		
		//modification du HTML present:
		////("INFOS: bindings presents dans la page!!!     --------------");
		////(BINDINGS);

		//englobe les dialogues dans un div container
		var dlgs = document.querySelectorAll("div[data-role=dialog]");
		if (dlgs){
			__decorate_widgets (dlgs,"dlg_container",hideDialog );
			/*for (i =0;i<dlgs.length;i++){
				dlg = dlgs[i];
				container = document.createElement("div");
				container.className = "dlg_container";

				//ajoute tous les childs de la dialogue au nouveau div?
				while (dlg.childNodes.length > 0) {
					container.appendChild(dlg.childNodes[0]);
				}
				dlg.appendChild(container);

				container.addEventListener("click",function(evt){evt.stopPropagation();})

				dlg.addEventListener("click", function(evt){
					//ferme le div
					 hideDialog(evt.target);
				});

			}*/
		}
		//idem pour les panels
		var pnls = document.querySelectorAll("div[data-role=panel]");
		if (pnls){
			__decorate_widgets (pnls,"empty_container", _hidePanel );
		}

                
                //initialise le binding
		init_binding();
		//i18n si necessaire
		init_i18n();
                
                
		//events pour les liens
		//recupere les liens # et place le onclick
		links = document.querySelectorAll("a[href^='#']");
		if (links){
			for (i=0;i<links.length;i++){
				var link = links[i];
				if (link.getAttribute('href')=='#'){
					//un lien pour rien (anchor))
					link.addEventListener('click',function(evt){
						evt.preventDefault();
					});
					continue;
				}
				else if (link.getAttribute('href')=='#BACK'){
					link.addEventListener('click',function(evt){
						evt.preventDefault();
                                                console.log("navigate to null");
						navigateTo(null);
					});
				}
				else{
                                        
					cible = document.getElementById(link.getAttribute('href').substring(1));
                                        
					if(cible==null) continue;

					role = cible.getAttribute('data-role');
                                        
					if (role ==  'page'){
						link.addEventListener('click',function(evt){
							evt.preventDefault();
							navigateTo(evt.target.getAttribute('href').substring(1));
						});
					} else if (role == 'dialog'){
						link.addEventListener('click',function(evt){
							evt.preventDefault();
							showDialog(evt.target.getAttribute('href').substring(1));
						});
					}
					else if (role == 'panel'){
                                                
						link.addEventListener('click',function(evt){
                                                        
							evt.preventDefault();
                                                        
							showPanel(evt.target.getAttribute('href').substring(1));
						});
					}
				}

			}
		}

		//initialise le binding
		

		CURRENT_PAGE = null;
		//recherche uniqument les pages pour la screen?
		pages = document.querySelectorAll("html>body>div[data-role=page]");
		//chargement de l'hitorique de la derniere session si existe...
		if (pages == null )return;
		if (CONTEXT.app_name == null) CONTEXT.app_name = getBaseUrl();

		h_key =  CONTEXT.app_name+"_history";
                
		if(!supportsWebStorage() || !(h_key in localStorage) ){
			//?? si reload page, doit le faire?
                        console.log("affiche par par defaut");
			navigateTo(pages[0].getAttribute('id'));
			return;
		}
		//tente de recuperer les infos
		//sous forme id_page = datas?
		page = null;
                //probleme parsing datas????
                try{
                        HISTORY =  JSON.parse(localStorage.getItem(h_key));
                        //recupere la derniere valeur de l'historique et recharge
                        if(HISTORY.length > 0){
                                console.log("history OK, navigate to NULL");
                                navigateTo(null);


                        }else{
                                //sinon, affiche simplement la premiere page de l'appli
                                console.log("no history");
                                navigateTo(pages[0].getAttribute('id'));
                        }
                } catch(Error){
                        console.log("error loading history");
                                navigateTo(pages[0].getAttribute('id'));
                }


    CONTEXT.end_init = true;//notifie la fin du chargement...
}

window.addEventListener("load",AppInit);
//lors de la fermeture, ajoute la page aux donn�es a sauvegarder...
window.addEventListener("beforeunload", function(evt){
	toggleFullScreen();

        console.log("SAVE SESSION STATE");
	if(supportsWebStorage()){

			//ajoute la page actuelle a l'historique
			old = document.getElementById(CURRENT_PAGE);
			if (old == null) return;


			for (i = 0; i< old._unload_delegate.length; i++){
				id = old._unload_delegate[i][0];
				delegate = old._unload_delegate[i][1];

				CONTEXT[delegate]();
			}
			/*sv = old.getAttribute('data-onunload');//pas de retour ici, on quitte!
			(sv == null || !(sv in CONTEXT))? null : CONTEXT[sv]();//un plain object*/
			dt={};//enregistrer id du fragment?
			for (i = 0; i< old._save_delegate.length; i++){
				id = old._save_delegate[i][0];
				delegate = old._save_delegate[i][1];
				dt[id] = CONTEXT[delegate]();
			}
			/*sv = old.getAttribute('data-onsavestate');
			dt = (sv == null || !(sv in CONTEXT))? null : CONTEXT[sv]();//un plain object*/



			h = obtain(CURRENT_PAGE,dt );
			HISTORY.push(h);//ajoute a l'historique
        
                        console.log(HISTORY);
			//sauvegarde en JSON
			h_key =  CONTEXT.app_name+"_history";
                        //sauvegarde ou?????
                        console.log("sauvegarde key:"+h_key);
                        localStorage.setItem(h_key,JSON.stringify(HISTORY));//???


	}

});

// GESTION BINDINGS DE DONNEES -------------------------------------------------------------------------------------------------------
var __verif_regex__ = new RegExp(/[^\{]*(\{binding(?: [\w_-]+:['\[]?[\$\w ,\._;%\-]+['\]]?)+\})/g);//verifie si correspond a un binding
var __regex__ = new RegExp(/(?: ([\w_\-]+):([\$\w,\._;%\-\$]+|(?:'[\w\s,\._;%\-]+')|(?:\[[\$\w\s,\._;%\-]+\])))/g);//recupere les infos



/*le binding par defaut, remplace les donn�es de la property binder par
le nouvelle valeur
*/
function __prop_binding(infos){

	this._path = infos.path; 			//getDomPath(this._element, infos.root);
    this.to=infos.to;					//nom de la property a binder, par defaut setValue?
    this.from = infos.from;				//nom de la datas (ou path) a binder
    this.mode = infos.mode;				//choix one_way, 2 way si input?
    this.converter = infos.converter;	//pour convertir les donn�es en ce qu'on veut
    this._converter_params = null;		//parametres pour le converter
    this._fallback = null;				//quoi afficher par defaut
	this.alt = infos.alt;				//liaison a d'autres property
	this._infos = infos;				//sauvegarde au cas ou
    this.root = infos.root;				//l'element root du binding
    this._element = infos._element;		//element html a binder (peut se trouver dans un model!!!)

    this._key_uuid_ = null;				//je m'en sert encore de ca???

	//Recupere le nom de toutes les property a sureiller pour la mise
	//a jour de ce binding
	//@param infos: les informations de binding
	//@return array: les noms de property a surveiller (from, alts et converter_params)
    this.getBindingKeys = function(infos){

        infos = infos || this._infos;
        //gestion du 'alt' ------------------------------------------------
        keys = infos.alt;
        if(keys) keys = keys.split(',');
        else keys = [];


        //si des parametres de converter, bind aussi....
        if(this.converter_params != null){
            for (ci=0;ci<this.converter_params.length;ci++){
                p = this.converter_params[ci];
                if (p[0]=='$'){
                    p=p.substring(1);
                    keys.push(p);//ajoute a la liste, pas acces au context pour l'instant...
                }
            }
        }


        keys.push(infos.from);//ajoute le from qd meme!

        return keys;
    }

	//met a jour le contenu du binding
	//@param value: la valeur a afficher (peut etre null)
	//@param context: le context de données courant
	//@param extra: des parametres en plus (non utilisé pour l'instant)
    this.populate = function(value, context, extra){

		if(value == null) value = this.fallback;
		value = this.convert_value (value, context);

        this._element[this.to] = value;
        this._key_uuid_ = context.__uuid__+":"+this.from;

    }

    Object.defineProperty(this, "converter_params",{
        set: function(value){

            if (value==null) this._converter_params = null;
            //split la chaine en un tableau de parametres
            else if (value[0]=='[' && value[value.length-1]==']'){
                //un tableau de parametres
                value = value.substring(1, value.length-1);
                this._converter_params = [];
                vs = value.split(",");
                for (vp=0;vp<vs.length;vp++){
                    p=vs[vp];
                    this._converter_params.push(__unstringify(p));
                }
            }

            else {
            //un seul parametre...
              this._converter_params = __unstringify(value);
            }
        },
        get:function(){return this._converter_params;}
    });
    Object.defineProperty(this, "fallback",{
        set: function(value){
            //verifie si a des '' devant???
            this._fallback = __unstringify(value);
        },
        get:function(){return this._fallback;}
    });

    this.converter_params = infos.converter_params;		//des parametres optionnels pour le converter TODO
    this.fallback = infos.fallback;						//si la valeur est null (ou invalide?), ce qui doit etre afficher

	//convertie la valeur passée au populate en fonction du converter et de ses
	//parametres
	//@param value: la valeur a convertir
	//@param context: le context de données courant
	//@param return: la valeur convertie
	this.convert_value=function(value, context){
        //au cas ou des params commencant par $
        if (this.converter!=null)
		{
            //les parametres
            //probleme, doivent suivre les modifs des parametres...
            p = null;//pour stocker les valeurs courantes des parametres...
            if(this.converter_params != null){
                if (Array.isArray(this.converter_params)){
                    p = [];
                    for (cpi=0;cpi<this.converter_params.length;cpi++){
                        if (this.converter_params[cpi][0]=='$'){
                            key = this.converter_params[cpi].slice(1);

                            v = context;
                            keys = key.split('.');
                            if (keys[0] == "global") {
                                v = CONTEXT;//passe en context global
                                keys = keys.slice(1);//et supprime global de la liste
                            }

                            for (k in keys){
                                k=keys[k];
                                if (k in v) v= v[k];
                                else {
                                    v = null;
                                    break;
                                }
                            }
                            p.push(v);//ajoute la valeur trouvée!

                        } else {p.push(this.converter_params[cpi]);}
                    }
                } else {
                    if (this.converter_params[0]=='$'){

                        key = this.converter_params.slice(1);

                        if(key in context){
                            p = context[key];//recupere la valeur actuelle, mais doit se tenir informé des modifs
                        }
                    }else {p=this.converter_params;}
                }
            }
		    value = window[this.converter](value,p);
		}
        return value;
    }

	//@deprecated
	this.clone = function(root){
		//cree un nouveau binding li� au root element
		infos = {};
		for(k in this._infos){
			infos[k]=this._infos[k];
		}
		//autorise le process event
		infos["process_event"] = true;
		//recupere l'element html a partir du root
		////("INFOS PATH: "+this._path);
		infos._element = root.querySelector(this._path);

		////("root of element");
		////(infos._element);
		return __create_binding_from_infos(infos);

	}

}


/* un binding sur une zone de texte (en general, entre 2 balises)*/
function __textContent_binding(infos){
    __prop_binding.call(this, infos);
    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)


    this.populate = function(value, context, extra){


        if(value == null) value = this.fallback;
		value =""+ this.convert_value (value, context);//force string



        //probleme, si binding interieur, il y a du texte...
        dt = this._element.textContent;


        //remplace dans la string html, garde ce qu'il y a avant et apres
        start = this._index == 0 ? "" : dt.substring(0, this._index);
        end = dt.substring(this._index + this._length);
        //la taille de la datas (pour pouvoir modifier apres)

        this._length = value.length;
        this._element.textContent = start + value + end ;
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }
}

/*binding d'un attribute HTML (ex: class)*/
function __attr_binding(infos){

    __prop_binding.call(this, infos);


    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)
    this.populate = function(value, context, extra){

        //pas une property de l'element (ex: class), modifie le html
        if(value == null) value = this.fallback;
		value =""+ this.convert_value (value, context);//force string

        dt = this._element.getAttribute("data-binded-"+this.to);
        if(dt == null){
            //ancienne facon?
            dt = this._element.getAttribute(this.to);
        }
        //remplace dans la string html, garde ce qu'il y a avant et apres
        start = this._index == 0 ? "" : dt.substring(0, this._index);
        end = dt.substring(this._index + this._length);

        this._element.setAttribute(this.to,start + value + end );
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }
}

/*bind un objet*/
function __model_binding(infos){
    __prop_binding.call(this, infos);
    this.presenter = infos.presenter;	//le code html pour l'affichage des donn�es de l'objet
	this.merge = infos.merge;			//@deprecated compliqué a expliquer pour une utilisation tres reduite (voir exemple SVG)


    this._stack = {};					//pour eviter de recreer des trucs a chaque fois...

	//ajoute un element au stack pour pouvoir reutiliser plus tard
	//@param type: le type de donnée (nom de la fonction constructeur)
	//@param stack: l'element html a ajouter au stack
    this._stack_push=function(type, stack){
        if (this._stack[type] == null) this._stack[type]=[];
        this._stack[type].push(stack);
    };

	//recupere un element du stack pour reutilisation
	//@param type: le type d'element a recuperer (nom de la fonction constructeur)
    this._stack_obtain=function(type){
        if(this._stack[type]!=undefined && this._stack[type].length > 0) return this._stack[type].splice(0,1)[0];
        return null;
    };

	/*
	Nettoie le html crée lors d'un precedent binding
	recupere tout et met dans un stack pour reutilisation
	*/
    this._clean = function(root){
        stack = {html:null, bindings:[]};
        old_type = 'Object';


        if (root.firstChild != null) {

            old_type = root.firstChild._ftw2_type;

            if(old_type != null){

                //les childs sont les models pour l'objet
                //recupere dans le stack
                stack.html = root.firstChild;
                old_type = "Object";
                current_keys = root.firstChild._ftw2_keys;



        		//TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
        		if(current_keys){
                    //("keys!");

                    model_bindings = [];
        			for (var key in current_keys){
        				//supprime de la page
        				current = current_keys[key];
        				for (bi=0;bi<current.length;bi++){
        					cr = current[bi];

        					index = BINDINGS[CURRENT_PAGE][key].indexOf(cr);

                            test = BINDINGS[CURRENT_PAGE][key].splice(index,1)[0];

        				    model_bindings.push(test);//supprime des bindings
                            if(BINDINGS[CURRENT_PAGE][key].length == 0) delete(BINDINGS[CURRENT_PAGE][key]);


        				}

        			}
        			this._current_keys ={};//supprime?
                    stack.bindings = model_bindings;
        		}

                //enregistre dans le stack
                //prends en compte le data_type ???
                this._stack_push (old_type,stack);
            }
            root.removeChild(root.firstChild);
        }



    }

	//gestion du cas value==null
    this._process_fallback = function(){
        //si value = null, affiche et bind le fallback
        if (this.fallback == null) {
            //regarde si a un datatype=fallback
            p_type =  this.presenter;
            presenter_type = p_type+"_fallback";

    		if (presenter_type in MODELS){
                elem = this._populate_model(CONTEXT, this.presenter, "fallback", false);
                this._element.appendChild(elem);

    		} else {

    			this._element[this.to] = " unknown model! ";//pas de model, ne fait rien
    		}



        } else {
            //affiche le fallback
            //probleme: doit pouvoir faire des bindings dedans????
            model = document.getElementById(this.fallback);//il peut y avoir du dtbdg dedans?
            if (model != null){

                //cree un nouveau model avec le fallback
                //binding du fallback: utilise le context global
                //elem = model.children[0].cloneNode(true);//fait une deep copy!
                elem = this._populate_model(CONTEXT, this.fallback, "fallback", false);
                this._element.appendChild(elem);
            }
            else {
                this._element[this.to] = " unknown model! ";//pas de model, ne fait rien
            }


        }
    }


	//affiche le contenu du model
	//@param context: l'objet javascript qui servira de context de données
    //@param mroot: element HTML root du presenter (par defaut, recupere this.presenter)
    //@param type: string type de la donnée (par defaut: context.constructor.name)
    //@param deep: si doit binder les données du context (par defaut iinfos.deep)
    this._populate_model = function(context, mroot,type, deep){
        //MODIF 0.2b: bind l'objet (prototype) si necessaire
		defineBindObject(context);
		var model =null;//penser a ca....le var!
		var root_model = document.getElementById(mroot || this.presenter);
        var bindings = null;

        item_type = type || context.constructor.name || "defaut";

        //verifie si existe un stack, si oui, recupere
        var frag =null;
        var current_keys = [];//les clés crées pour ce model
        var deep_binding = deep || this._infos.deep || true;//pour savoir si rend accessible les données internes au binding


        var old_stack = this._stack_obtain(item_type);
        if (old_stack != null){
            //initialise a partir de ce qui est deja crée
            console.log("Recupere du stack....");
            //les bindings....

            var model_bindings = old_stack.bindings;
            current_keys = [];



            for (var mbi=0;mbi<model_bindings.length;mbi++){
                var mbd = model_bindings[mbi];
                if(mbd.init != null) mbd.init(context);


                //inscription des clés d'events: uniquement si demandé, ou par defaut?
                if (deep_binding){
                    //gestion du 'alt' ------------------------------------------------
                    keys = this.getBindingKeys(mbd._infos);

                    for (kk = 0; kk<keys.length; kk++){
                        n_key = keys[kk];
                        //enregistre les bindings et notify
                        g_key = context.__uuid__+":"+n_key;
                        //("create key: "+g_key);
                        if (g_key in BINDINGS[CURRENT_PAGE]){
                            //deja connu, ajoute simplement a la liste
                            BINDINGS[CURRENT_PAGE][g_key].push(mbd);
                        }
                        else {
                            //inconnu, cree une nouvelle entr�e
                            BINDINGS[CURRENT_PAGE][g_key]= [mbd] ;
                        }

                        //enregistre pour pouvoir nettoyer plus tard....
                        if (g_key in current_keys){
                            //deja connu, ajoute simplement a la liste
                            current_keys[g_key].push(mbd);
                        }
                        else {
                            //inconnu, cree une nouvelle entr�e
                            current_keys[g_key]= [mbd] ;
                        }

                    }
                }

                //notifie le binding maintenant????
                //__notifyDatasetChanged(context,model_bindings, key);
            }


            //pour chq binding recuperé, doit mettre  a jour...
            //populate directement???
            /*for (k in context){
                g_key = context.__uuid__+":"+k;
                 if (typeof context[k]!= "function" && g_key in BINDINGS) {
                     __notifyDatasetChanged(context,BINDINGS[g_key], g_key);
                 }
            }*/
            __notifyDatasetChanged (context,model_bindings );
            //notifie et populate les bindings  ????

            //doit aussi rectourner les clés...
            frag = old_stack.html;


        }
        else {
            //doit tout creer...
            p_type = mroot || this.presenter;
            presenter_type = p_type+"_"+item_type;
            console.log("Creation d'un nouveau model "+p_type);

    		if (presenter_type in MODELS){
    			bindings = MODELS[presenter_type] ;
    			model = root_model.querySelector("[data-type='"+item_type+"']");
    		} else {

    			bindings = MODELS[p_type] ;
    			model = root_model.children[0];
    		}



            if (model == null ){

                this._element[this.to] = " unknown model! "+context;//pas de model, ne fait rien
                return;
            }

            //fait une copie du model

    		var cpy_model = model.cloneNode(true);

            //ajoute le type de données dans le htmlelement, j'ai pas trouvé comment faire
            //autrement...

            cpy_model._ftw2_type = item_type;
    		var frag = cpy_model;


    		//fait une copie des bindings de se model et ajoute aux bindings de la page a apartir de la copie

            for(key in bindings){


                var bd = [];
    			for(h=0;h<bindings[key].length;h++){

                    //copie les infos de binding
    				var infos = {};
    				inf = bindings[key][h];
    				for(k in inf){
    					infos[k]=inf[k];
    				}

    				//autorise le process event
    				infos["process_event"] = true;
    				//recupere l'element html a partir du root

    				infos._element = cpy_model.querySelector(infos.path);

                    //cree un nouveau binding
    				var clone = __create_binding_from_infos(infos);//cree le binding, passe la valeur a binder pour determiner le type

                    if (deep_binding === true){
                        //gestion du 'alt' ------------------------------------------------
                        keys =  this.getBindingKeys(infos);
                        //enregistre les bindings
                        for (kk = 0; kk<keys.length; kk++){

                            n_key = keys[kk];

                            //si processinput, utilise UUID du contexte globale
                            g_key =context.__uuid__+":"+n_key;
                            //("cree nouvelle clé: "+g_key);
                            if (g_key in BINDINGS[CURRENT_PAGE]){
                                //deja connu, ajoute simplement a la liste
                                BINDINGS[CURRENT_PAGE][g_key].push(clone);
                            }
                            else {
                                //inconnu, cree une nouvelle entr�e
                                BINDINGS[CURRENT_PAGE][g_key]= [clone] ;
                            }

                            //enregistre pour pouvoir nettoyer plus tard....
                            if (g_key in current_keys){
                                //deja connu, ajoute simplement a la liste

                                current_keys[g_key].push(clone);
                            }
                            else {
                                //inconnu, cree une nouvelle entr�e

                                current_keys[g_key]= [clone] ;
                            }


    					}
                    }

                    //enregistre le binding
                    //devrait plutot enregistrer les clés uniquement?
    				bd.push(clone);

    			}

                __notifyDatasetChanged(context,bd, key);
            }

        }

        frag._ftw2_keys = current_keys;
        //doit retourner le fragment ET les clés créees...
        return frag;
    }
    this.populate = function(context, parent, extra){
	    //casse la methode pour arraymodel
		//nettoie si a deja qqchose
		//tout retirer d'un coup?
        context = this.convert_value (context, parent);
        this._clean(this._element);

        //this._current_keys ={};
        //("populating model! "+this.from);

        //nettoie le contenu, passe dans le stack pour reutilisation possible
        //besoin de connaitre le type...


		if (context == null){
            //modif, utilise le fallback comme data-type

                this._process_fallback();
                return;


		}

		//ajoute l'element d'un coup, pas besoin de fragment?
        this._element.appendChild(this._populate_model(context));//le html generé

        this._key_uuid_ = context.__uuid__+":"+this.from;
    }
}

/*binding d'un array*/
function __array_binding(infos){
    __model_binding.call(this, infos);


    this.presenter = infos.item_presenter;	//pour affichage de listes//MODIFS: possible d'avoir des datas type....


	this.merge = infos.merge;
	//sql like
	this.order_by = infos.order_by; 		//un nom de variables pour ordonner la liste
	this.group_by = infos.group_by;			//nom de variable pour grouper les items NON SUPPORTE POUR L'INSTANT!
	this.select_if = infos.select_if;		//nom de methode true/false pour selectionner un item

	this.ascending = infos.ascending;		//boolean ordre ascendant/decscendant
	this._current_keys = null;				//cl� de binding cr�es dans la page...

    //this._view = {};//la vues precedentes

	//@deprecated
	this._clear_binding = function(bindings){
		//nettoie le binding
		for(key in bindings){

			//pour chq items de l'array
			//passe en context l'item!
			__notifyDatasetChanged(null,bindings[key], key);
		}
	}

	/*
	Nettoie le html crée lors d'un precedent binding
	recupere tout et met dans un stack pour reutilisation
	*/
    this._clean_child = function(child){

        stack = {html:null, bindings:[]};
        old_type = 'Object';


        if (child != null) {
            //probleme: si model binding entré directement dans une balise...
            old_type = child._ftw2_type;

            if(old_type != null){

                //recupere dans le stack
                stack.html = child;
                old_type = "Object";
                current_keys = child._ftw2_keys;//chq model a ses keys!



                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){

                    model_bindings = [];
                    for (var key in current_keys){
                        //supprime de la page
                        //("supprime: "+key);
                        current = current_keys[key];
                        for (bi=0;bi<current.length;bi++){
                            cr = current[bi];

                            index = BINDINGS[CURRENT_PAGE][key].indexOf(cr);

                            test = BINDINGS[CURRENT_PAGE][key].splice(index,1)[0];

                            model_bindings.push(test);//supprime des bindings
                            if(BINDINGS[CURRENT_PAGE][key].length == 0) delete(BINDINGS[CURRENT_PAGE][key]);

                            //supprime aussi de current_keys....                TODO
                        }

                    }
                    //this._current_keys ={};//supprime?
                    stack.bindings = model_bindings;
                }

                //enregistre dans le stack
                //prends en compte le data_type ???
                //("adding to stack "+old_type);
                this._stack_push (old_type,stack);
            }
            this._element.removeChild(child);
        }



    }
    this.populate = function (value, context, extra){

        /* //definie les actions par defaut (ie: pas d'extras)

        NOTE: on verra plus tard comment implementer ca bien...

        remove_childs = this._element.children;//par defaut, supprime tous les childs de la liste

        value = this.convert_value (value, context);


		if (value == null || value.length == 0){
			this._process_fallback();
			return;
		}


        add_childs = value;//les elemnts a ajouter/classer
        s_i = (this.select_if != null && this.select_if in CONTEXT) ? CONTEXT[this.select_if] : null;


        //si un extra, modifie les actions...
        if (extra != null){
            //("Extra actions:"+extra.action+": "+extra.value);
            //suivant l'action (set,push,...) agit au mieux...
            switch(extra.action){
                case 'SET':{
                    //modifie 1 seul element, ie: supprime et remet en place
                    //recherche l'element avec uuid correspondant
                    for (ci=0;ci<this._element.children.length;ci++){
                        if (this._element.children[ci].__uuid__ == extra.value ){
                            removeChilds = [this._element.children[ci]];
                            break;
                        }
                    }

                    //trouve l'element juste avant dans la liste
                    //pour pouvoir s'ajouter derriere... (ie: insertAfter)
                    if (s_i && s_i(value[extra.index]))  add_childs = [value[extra.index]];//celui a afficher

                    break;
                }
                case 'POP':{
                    //supprime le  dernier de la listes

                    for (ci=0;ci<this._element.children.length;ci++){
                        if (this._element.children[ci].__uuid__ == extra.value){
                            removeChilds = [this._element.children[ci]];
                            break;
                        }
                    }
                    add_childs = [];//rien a ajouter
                    break;
                }
                case 'PUSH':{
                    //ajoute a la fin
                    remove_childs = [];//rien a enlever
                    break;
                }
                case 'SHIFT':{
                    //ajoute au debut
                    remove_childs = [];//rien a enlever
                    break;
                }
                case 'UNSHIFT':{
                    //???
                    break;
                }
                case 'SPLICE':{
                    //supprime le dernier de la listes
                    add_childs = [];//rien a ajouter
                    break;
                }
                default: break;
            }
        }




        //nettoie les elements html inutiles si besoin
        for(ci=remove_childs.length-1;ci>=0;ci--){
            this._clean_child(remove_childs[ci]); //methode n'existe pas...
        }

        //ajoute les nouveaux elements

        tmp = null;


        o_b = this.order_by;
        g_b = this.group_by;

        if (o_b || g_b){
            //organise les données
            tmp =this._view;
            for (ai=0;ai<add_childs.length; ai++){
                //determine le groupe
                child = add_childs[ai];
                cible = tmp.defaut;
                if(g_b!=null){
                    group = "_"+g_b;
                    if(tmp[group]== null)tmp[g_b] = [];
                    cible = tmp[group];
                }

                //determine l'ordre
                if(o_b!=null){
                    //met en premiere position
                    tmp.shift(child);
                    t = tmp[1];
                    ti = 1;

                    order = "_"+o_b;
                    while(child[order]<t[o_b] && ti<tmp.length){
                        //swap
                        tmp[ti-1] = t;
                        tmp[ti] = child;
                        ti++;
                        t=tmp[ti];//next;
                    }
                    //en position!
                    //met le html ici????


                }
            }
        }
        else
        {
            //par defaut...
        }


        //modifie le html
        for (ci=0; ci<add_childs.length;ci++){
            //doit etre placé???

        }

        //this._current_keys =[];
        this._view = tmp;//sauvegarde au cas ou...
        */
        elem = this._element;
        //nettoie le model si a deja qqchose ????
        //normalement, 1 seul child...
        while (elem.hasChildNodes()) {
             elem.removeChild(this._element.firstChild);
        }

        //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
        if(this._current_keys){


            for (key in this._current_keys){
                //supprime de la page
                current = this._current_keys[key];
                for (bi=0;bi<current.length;bi++){
                    cr = current[bi];

                    index = BINDINGS[CURRENT_PAGE][key].indexOf(cr);
                    BINDINGS[CURRENT_PAGE][key].splice(index,1);//supprime des bindings

                }

            }
            this._current_keys = null;//supprime?
        }
		this._current_keys = {};
        value = this.convert_value (value, context);

        /*recupere le model pour les items*
        */
        if (value == null || value.length == 0){
            if (this.fallback == null) {
                this._element[this.to] = " unknown model! ";//pas de model, ne fait rien

            } else {
                //affiche le fallback
                //probleme: doit pouvoir faire des bindings dedans????
                model = document.getElementById(this.fallback);//il peut y avoir du dtbdg dedans?
                if (model != null){

                    //cree un nouveau model avec le fallback
                    //binding du fallback: utilise le context global
                    //elem = model.children[0].cloneNode(true);//fait une deep copy!
                    elem = this._populate_model(CONTEXT, this.fallback, "fallback", false);
                    this._element.appendChild(elem);
                }
                else {
                    this._element[this.to] = " unknown model! ";//pas de model, ne fait rien
                }


            }
            return;
        }




        //mise en place: depend de ce qu'il y a a rajouter....                  TODO!!!!!!!!!!!!!!!!!
        tmp = {defaut:[]};

		//si doit modifir la liste pour l'affichage

		if (this.select_if || this.order_by || this.group_by){


			s_i = (this.select_if != null && this.select_if in CONTEXT) ? CONTEXT[this.select_if] : null;

			o_b = this.order_by;
			g_b = this.group_by;

			//pour chq item...
			for (item_i = 0; item_i<value.length; item_i++){
				item = value[item_i];
				if (s_i && s_i(item) != true) continue;//non selectionn�

				group = null;
				//choix du group
				if (g_b && g_b in item){

					g = "_"+item[g_b];
					if (g in tmp) {

						group = tmp[g];

						if (o_b){
							//cherche ou le mettre (ascendant uniquement?)
							__array_insert_order (group, item, o_b, this.ascending);
						}

					}
					else {

						//group inconnu, insert ou on peut
						tmp[g]=[item];
					}
				}
				else {

						//group inconnu, insert ou on peut
						tmp["defaut"].push(item);
					}

			}

		}
		else {
			tmp = {"defaut": value};
		}

		//affichage des groupes
		bindings = null;
		model = null;

		var frag = document.createDocumentFragment();
		if (this.group_by === undefined){
			//uniquement le defaut

			this.__populate_group(tmp["defaut"], frag);
		}
		else {
			//pour chaque group a afficher

			for (group in tmp){
				//affiche le header?
				//affiche les datas
				this.__populate_group(tmp[group], frag);
			}

		}
		this._element.appendChild(frag);
        this._key_uuid_ = context.__uuid__+":"+this.from;
		//nettoie le binding
		//this._clear_binding (bindings);


    };

	//affiche le contenu d'un tableau
	//@param arr: le tableau a afficher
	//@param parent: l'element html a qui ajouter les items de la liste
	this.__populate_group = function(arr, parent){


        for (item_i = 0; item_i<arr.length; item_i++){
            //(arr);

			item = arr[item_i];

            //model binding simple????
            result = this._populate_model(item);
            result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

            parent.appendChild(result);


        }

	};
}

//utilitaire: permet de trier les elements d'une liste
//@param arr: le tableau dans lequel mettre l'element
//@param item: l'element a inserer dans le tableau
//@param o_b : nom de la property de l'element a utiliser comme comparateur
//NOTE: si o_b se modifie, doit modifier l'affichage du tableau: modif getKeysBinding
function __array_insert_order (arr, item, o_b){

	for (li=0;li<arr.length;li++){
		pitem = arr[li];
		if (item[o_b] < pitem[o_b]){
			//ajoute ici
			arr.splice(li,0, item);
			return;//fini
		}
	}
	//ajoute a la fin
	arr.push(item);
}


/*binding d'une commande*/
function __command_binding(infos){

    __prop_binding.call(this, infos);

    infos.from = this.from = "COMMANDS";

    this.context = null;
    this.command = infos.command; 	//la methode du context de données global a executer
    this._cmd_parameters = null;    //des parametres pour la methode
	Object.defineProperty(this, "command_params",{
        set: function(value){
            if (value==null) this._cmd_parameters = null;
            //split la chaine en un tableau de parametres
            else if (value[0]=='[' && value[value.length-1]==']'){
                //un tableau de parametres
                value = value.substring(1, value.length-2);
                this._cmd_parameters = [];
                for (p of value.split(',')){
                    this._cmd_parameters.push(p);
                }
            }

            else {
              this._cmd_parameters = [value];
            }
        },
        get:function(){return this._cmd_parameters;}
    });
	this.command_params =  infos.command_params;



    var bind = this;

	//gestion de l'event pour la commande
    this.__process_event =  function(evt){

        console.log("Hello command!");
        console.log(bind.context);
        if (bind.context == null) return;
        //recupere le nom de la methode
        value = bind.command;
        if(value == null) value = bind.fallback;
        value = bind.convert_value (value, bind.context);
        params = null;
        //appel a la methode, passe les données
        if (bind.command_params!=null){
            params=[];


            for (cpi=0;cpi<bind.command_params.length;cpi++){
                if (bind.command_params[cpi][0]=="$"){
                    //recupere le nom de la prop
                    prop = bind.command_params[cpi].substr(1);

                    if (prop in bind.context) params.push(bind.context[prop]);//par valeur
                    else params.push('null');
                }
                else params.push(bind.command_params[cpi]);
            }

        }
        CONTEXT[value](evt,params);

    }

	//initialise la commande
	//@param ctx: le context de donnée
    this.init = function(ctx){
        this.context=ctx;
        if (this.command != null && this.to!=null){
            this._element.addEventListener(this.to,this.__process_event);
        }
    };
    this.populate = function (value, context, extra){
        this.init(context);
    };


}

/*binding d'un element de formulaire (input?)*/
function __input_binding(infos){
	__prop_binding.call(this, infos);
	this._pass = false;					//pour firefox mobile!

	//met a jour la donnée javascript
	//@param value: la valeur entrée par l'utilisateur
	this.mirror = function(value){
		this._pass = true;
		ctx = this.context == null ? CONTEXT : this.context;
        ctx[this.from] = value;
		this._pass=false;
    }
	this._event =infos.event == null ? 'blur' : infos.event;//qd envoyer les infos de changement
	//par defaut, sur le lost focus/enter ?
	//possible input

	//met en place l'event de mise a jour?
	var bind=this;
	this.on_process_event = function(evt){

		//par exemple, check box n'a pas de property value...
		value = this.value || this[bind.to];

		try{
			bind.mirror(value);//appel a methode mirror de l'event???

			bind._element.setCustomValidity("");
		}catch(err){

			if(err.message)err = err.message;
			bind._element.setCustomValidity(err);
		}
	};
	//probleme, si dans un model, ne bind pas l'element cr�e
	//mais si pas de parent, DOIT ajuter l'event handler!!!
	if(d_b.process_event == true){
		this._element.addEventListener(this._event, this.on_process_event);
	}

	//@deprecated
	this.clean = function(){
		//supprime l'event listener
		infos._element.removeEventListener(this._event, this.on_process_event);
	}
	this.populate = function(value, context, extra){

		if(this._pass){ //firefox mobile! si change la value programmatiquement, lance qd meme l'event change/input
			return;
		}

		this.context = context;//enregistre le context de donn�es pour plus tard....
		//penser a nettoyer ca plus tard...


        //une property de l'element, modifie directement et completement
        //probleme, peut demander a utiliser un model! ---------------------------------> TODO

        if(value == null) {
            this._element.value="";
            this._element.placeholder = this.fallback;
            return;
        }

		value = this.convert_value (value, context);


		//met a jour l'UI
		this._element[this.to] = value;
    }

}
/*A appeller dans un addEventListner('load') pour initialiser le binding des proprietes
@context: objet contenant les proprietes a binder
*/
function init_binding(){

	//les bindings globaux, ie panels et dialogs accessibles a tout le monde
	globs = document.querySelectorAll("body>div:not([data-role='presenters']):not([data-role='page'])");
	if (globs != null ){

		for (i=0;i<globs.length;i++){
            var glob = globs[i];

            id = glob.getAttribute("id");

            if (id == null) continue; //n'autorise pas de models sans id!
			//cree les bindings
			g_b = __get_bindings(glob,true);

			if (Object.keys(g_b).length === 0  ) continue;



			BINDINGS.__global__[id]=g_b;

		}
	}

    //si existent des models dans la page, recupere les
    models_node = document.querySelector("body>div[data-role=presenters]");

    if (models_node != null){

        models = models_node.querySelectorAll("body>div[data-role=presenters]>[data-role=presenter]");

        for (i=0;i<models.length;i++){
            var model = models[i];

            id = model.getAttribute("id");

            if (id == null) continue; //n'autorise pas de models sans id!

			//ici, si plusieurs childs, veut dire plusieurs data-type
			if (model.children.length == 1){
				//cree les bindings pour ce model
				MODELS[id] = __get_bindings(model, false);//false: ne met pas en place les events handlers
			} else {
				//utilise des data-types, doit creer un binding par data-type
				for (c_i = 0; c_i < model.children.length; c_i++){
					mdl = model.children[c_i];
					dtype = mdl.getAttribute("data-type");
                    //("MODEL BINDING");
					if (dtype == null){
						//model par defaut
						MODELS[id] = __get_bindings(mdl, false);
					} else {
						//un datatype
						MODELS[id+"_"+dtype] = __get_bindings(mdl, false);
					}
				}
			}


            //supprime l'element du node models??
        }

    }
    //recupere tous les elements not�s data-binded, group�s par data-role="page"
    pages = document.evaluate("//div[@data-role='page']", document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if(pages == null || pages.length == 0){
        //pas de pages
        pages = [document];
	}
    /*    CURRENT_PAGE = 'doc';//marque le document comme page courante
    }else{
        CURRENT_PAGE = pages[0].getAttribute("id") || "doc";//marque la 1ere page comme courante
    }*/


    for (i=0;i< pages.snapshotLength;i++){

	//while (page != null)
		snapshot = pages.snapshotItem(i);

                page_id = snapshot.getAttribute("id") || "doc";
		page = document.getElementById(page_id);

                //cree les delegates de la page
		page._restore_delegate = [];
		page._load_delegate= [];
		page._unload_delegate = [];
		page._save_delegate = [];


		//ajoute ceux de la page si existent
		on_ = page.getAttribute("data-onrestore");
		if ( on_!= null) page._restore_delegate.push([page_id,on_]);

		on_ = page.getAttribute("data-onload");
		if ( on_!= null) page._load_delegate.push([page_id,on_]);

		on_ = page.getAttribute("data-onunload");
		if ( on_!= null) page._unload_delegate.push([page_id,on_]);

		on_ = page.getAttribute("data-onsave");
		if ( on_!= null) page._save_delegate.push([page_id,on_]);


		//plusieurs cas: pas de view, des views, ou la page dedi�e
		//recupere la view suivant la taille actuelle du screen
		//small, medium, wide
		views = document.evaluate("./div[@data-role='view']", page, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (views.snapshotLength>0){
			////("des vues!");
			//a des vues, recherche si une corespondante
			//par defaut, utilise la premiere
			view = views.snapshotItem(0);//par defaut
			for (vi=0;vi<views.snapshotLength;vi++){
				v = views.snapshotItem(vi);
				if(v.hasAttribute("data-type") && v.getAttribute("data-type")== SCREEN){
				////("find view for "+SCREEN);
					view = v;
					break;
				}
			}

                        
                        //ajoute des delegate pour les views????
			//nettoie la page et met la vue en fils unique
                        //remove childs
                        while(page.firstChild){
                                page.removeChild(page.firstChild);
                        }
                        page.appendChild(view);
			//page.innerHTML=view.innerHTML;

		}

			//pas de vue, utilse la page


		//les fragments -----------------------------
		
		//pour chaque page, verifie si a des fragments
		frgs = document.evaluate(".//*[@data-role='fragment']", page, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (frgs != null){
                        console.log("evaluating fragments "+frgs.snapshotLength);
			for ( var j=0 ; j < frgs.snapshotLength; j++ ){
				frg = frgs.snapshotItem(j);

				frg_id = frg.getAttribute("id");
				src_id = frg.getAttribute("data-fragment-id");
				if (src_id == null) continue;
				if(frg_id == null) continue;//n'autorise pas sans id!
				f_elem = document.getElementById(src_id);
				if (f_elem == null) continue;

				//ajoute ceux de la page si existent
				on_ = frg.getAttribute("data-onrestore");
				if ( on_!= null) page._restore_delegate.push([frg_id,on_]);

				on_ = frg.getAttribute("data-onload");
				if ( on_!= null) page._load_delegate.push([frg_id,on_]);

				on_ = frg.getAttribute("data-onunload");
				if ( on_!= null) page._unload_delegate.push([frg_id,on_]);

				on_ = frg.getAttribute("data-onsave");
				if ( on_!= null) page._save_delegate.push([frg_id,on_]);

				//ajoute a la page

				document.getElementById(frg_id).innerHTML = document.getElementById(src_id).innerHTML;

				//prochain fragment de la page
				//frg = frgs.iterateNext();//probleme, invalidestateerror?
			}
			//integre le fragment ici? ----------------------------------------  A VOIR?


		}
		//end ---------------------------------------

		//NOTE: si process_event = true, utilise UUID du contexte???
        BINDINGS[page_id] = __get_bindings(page, true);
        //page = pages.iterateNext();
    }

}




/**permet de mettre a jour l'ui lorsqque les datas ont chang�es
@param key: le nom de la property qui a chang�e ou null pour mettre a jour toute la page
@args: parametres optinnels ou particulier a un type de binding*/
function notifyDatasetChanged(key){

	//contexte a prendre en compte////
	if (key==null || key==''){
        //met a jour toute la page

        for(key in BINDINGS[CURRENT_PAGE]){
            notifyDatasetChanged(key);
        }
		//met a jour les bindings globaux???
		for (glob in BINDINGS.__global__) {
			for (key in BINDINGS.__global__[glob]) {
				__notifyDatasetChanged(CONTEXT,BINDINGS.__global__[glob][key], key);
			}
		}
    }
    else {
	////("met a jour la key: "+key);
        if (key in BINDINGS[CURRENT_PAGE]) {
			////("OK");
			__notifyDatasetChanged(CONTEXT,BINDINGS[CURRENT_PAGE][key], key);
        }
		//verifie si dans les bindings globaux
		for (glob in BINDINGS.__global__) {
			if (key in BINDINGS.__global__[glob]) {
				__notifyDatasetChanged(CONTEXT,BINDINGS.__global__[glob][key], key);
			}
		}




    }
}
function __notifyDatasetChanged(context,bindings, key){

	for (k in bindings) {

		var value = null;
		binding = bindings[k];



		if(key=='$this' || binding.from == '$this') value = context;//a voir....
		else{

			v_key = binding.from;

			if(context!= null && v_key in context){
				value = context[v_key];
			}
		}

        binding.populate(value, context);

    }
}
function __get_bindings(root, process_event){

    //binders = root.querySelectorAll('[data-binded]');
	//MODIF: utilise XPath
	//recupere aussi dans le text content...

    //doit faire le xpath a partir du root!!!                                   TODO: bug: doit limiter le binding a l'element root
    //(root);
	binders = document.evaluate(".//*[not(ancestor::*[@data-nobind]) and not(@data-nobind) and contains(text(),'{binding ') or @*[contains(.,'{binding ')]]",
            root,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null);
	//me renvois tout les elements de la page?????

    if (binders == null) return; //rien a faire

	var elem = binders.iterateNext();//MODIF: passe au suivant

    pg_bindings = {};

    //recupere les elements de la page demandant un binding de donn�es

	//for (ii=0;ii<binders.snapshotlength;ii++){
	while (elem != null){
		//elem = binders[ii];
        //parse tous les attributs pour trouver ceux bind�s
        //(elem);
        bindings = __get_binding_from_attributes(elem, root, process_event);


        if (bindings==null || bindings.length == 0){
			elem = binders.iterateNext();
			continue;
        }

        //for (binding of bindings){
		for (j=0;j<bindings.length;j++){
			binding = bindings[j];
			//ici, bon endroit pour specifier un binding parent si existe...



            k = binding.from==null ? binding.command : binding.from ;


            if (k == null) {
				continue;
			}

            if (process_event){
                //traite aussi les alt
                keys = binding.alt;

    			if(keys) keys = keys.split(',');
    			else keys = [];

    			keys.push(k);//ajoute le from qd meme!

    			//pour chaque cl� de bindings....
    			for (kk = 0; kk<keys.length; kk++){
    				key = keys[kk];
    				//si processinput, utilise UUID du contexte globale
    				key = CONTEXT.__uuid__+":"+key;
    				if (key in pg_bindings){
    					//deja connu, ajoute simplement a la liste
    					pg_bindings[key].push(binding);
    				}
    				else {
    					//inconnu, cree une nouvelle entr�e
    					pg_bindings[key]= [binding] ;
    				}
    			}
            } else {
                //enregistre simplement

                if (k in pg_bindings){
                    //deja connu, ajoute simplement a la liste
                    pg_bindings[k].push(binding);
                }
                else {
                    //inconnu, cree une nouvelle entr�e
                    pg_bindings[k]= [binding] ;
                }
            }



        }
		//MODIF
		elem = binders.iterateNext();

    }


    return pg_bindings;
}
//parse le contenu de la commande binding pour savoir quoi en faire
//TODO finir le parsing des commandes
//INTERNAL
function __get_binding_from_attributes(elem,root, process_event){
    bindings = [];


	attrs = elem.attributes;

    //for (attr of elem.attributes){
	for (ij=0; ij<attrs.length;ij++){
		attr = elem.attributes[ij];

		bind = __parse_attribute (elem, root, attr.nodeName,attr.value, process_event );

		if(bind != null )bindings.push(bind);

    }

    var nodes = elem.childNodes;
    var result = "";
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].nodeType == 3) {       // If it is a text node,
            // MIEUX VAUT MINIFIER LE HTML AUSSI!
    		result += nodes[i].textContent;
        }
    }
    result.trim();
    if(result != ""){
        bind = __parse_attribute (elem, root, 'innerHTML', result, process_event );
        if(bind != null )bindings.push(bind);
    }
    return bindings;
}
function __parse_attribute(elem, root, nodeName, value, process_event){
		cmds = value;

        if (cmds == null || cmds == '') return null;
        match = __verif_regex__.exec(cmds);

        if (match == null) return null;//pas de correspondance pour le premier        //prends en compte plusieurs matches (par exemple pour les classes,????
        //while (match != null){
		cmds = match[1];//unqiuement les infos de bindings

		//cree le binding et populate (par regex)

		d_b = {};//un objet vide

		//si process event, recupere l'element, sinon, get path

		d_b["_element"]= elem;//le html a binder
		//else d_b["_element"] = getDomPath(elem, root);
		d_b["root"] = root;//le root de l'element (si necessaire)
		d_b["path"] = getDomPath(elem, root);


		to=nodeName;//le nom de l'attribut
		//MODIF: si commence par data-binded-, extrait e nom de la property
		if(to.indexOf("data-binded-") == 0) {

			to=to.split('-')[2];
		}

		d_b["to"]=to;

		match_index = __verif_regex__.lastIndex - cmds.length ;

		d_b['_index'] = match_index;//position dans la chaine
		d_b["_length"] = cmds.length;

		//recupere les commandes
		match2 = __regex__.exec(cmds);
		while (match2 != null){

			d_b[match2[1]] = match2[2];
			match2 = __regex__.exec(cmds);
		}
		__regex__.lastIndex = 0;//remet a zero pour leprochain coup
		//match = __verif_regex__.exec(cmds);//cherche un autre binding dans la ligne
        //}

        __verif_regex__.lastIndex = 0;//remet a zero pour le prochain coup

        if (d_b["from"] == null && d_b["command"]==null) return null;
		d_b["process_event"] = process_event;


		var bind = d_b;

		//si doit etre utiliser de suite, cree le binding sinon, n'enregistre que les infos
		if (process_event){
            //doit passer la valeur si un array?
			bind = __create_binding_from_infos(d_b);
		}




        return bind;
}
//fabrique pour les bindings
function __create_binding_from_infos(d_b){
    //renvoie le 'bon' type de binding
	//probleme, si 2way pour un input...

    if(d_b["presenter"] != null){
        d_b.to = "innerHTML";
        //determine si le contexte de données est une liste ou un objet simple....

        return new __model_binding(d_b);
    }
    if(d_b["item_presenter"] != null){
        //affichage pour un array!

        d_b.to = "innerHTML";
        return new __array_binding(d_b);
    }
    if(d_b["command"] != null){

        return new __command_binding(d_b);
    }
	if (d_b["mode"] == '2way'){// && d_b._element.localName == 'input'){
		//consider input oblig�?
		return new __input_binding(d_b);
	}
	if(d_b.to == 'innerHTML') return new __textContent_binding(d_b);
    if(d_b.forceAttr == null && d_b.to in d_b._element) return new __prop_binding(d_b);
    else{

		return new __attr_binding(d_b);
    }

}
//helper methode, retire les '' d'une propriete
//@temp en attendant de faire mieux pour la regex
function __unstringify(value){
    if (value!=null && value[0]=="'" && value[value.length-1]=="'"){
        //un tableau de parametres
        value = value.substring(1, value.length-1);
    }
    return value;
}

// GESTION i18n -----------------------------------------------------------------------------------------------------------------------
var LOCAL_VALIDITY = null;
var _I18N_ = {};

function getLocale(){
	if(navigator.languages) return navigator.languages[0];
	else if(navigator.browserLanguage) return navigator.browserLanguage;
	else return navigator.language;
}
function init_i18n(){
	language = getLocale();
	//probleme, peut etre la local (ie fr-FR), ou juste la langue (ie fr)
	//recup la langue dans le local
	if (language in localStorage){
		//present, recup la date et fait une requete au serveur
		h_key = CONTEXT.app_name == null ? "default_app_"+language : CONTEXT.app_name+"_"+language;

		LOCAL_VALIDITY = localStorage.getItem(language);
		_download_lang(language,LOCAL_VALIDITY );
	}
	else {
		//pas de date, dons pas de fichier, essaie de recup sur serveur
		_download_lang(language);
	}
}
function _download_lang (locale, date){
	url = "i18n.php?locale="+locale;
	if (date) url+="&date="+date;


	var xhr = new XMLHttpRequest();

	xhr.onload = function(e){

		if(xhr.status == "200") {
			//("reponse!");
                  try{
                          json_datas = xhr.response;
                          datas = JSON.parse(json_datas);
                                //sauvegarde la nouvelle date
                                last_modif = xhr.getResponseHeader("Last-Modified");


                                h_key = CONTEXT.app_name == null ? "default_app_"+locale : CONTEXT.app_name+"_"+locale;
                                localStorage.setItem(h_key, last_modif);
                                //sauvegarde les donnes
                                h_key = CONTEXT.app_name == null ? "default_app_i18n" : CONTEXT.app_name+"_i18n";
                                localStorage.setItem(h_key,json_datas);

                                //met a jour
                                __i18n__(datas);
                  } catch (Error){
                          
                  }


		}
		else if (xhr.status == "403"){
			//no change
			//("pas de changement");
			__i18n__();
		}
		else
		{

		    if (LOCAL_VALIDITY!=null){
				__i18n__();//charge celui en memoire
			}
			//sinon, laisse tel quel
			//("erreur chargement i18n, laisse comme c'est");
		}

	};
	xhr.open('GET', url);
    xhr.send();
}
function __i18n__(datas){
        try{
                dts = document.querySelectorAll("[data-i18n]");
                if(dts == null) return;
                if(datas == null) datas = JSON.parse(localStorage.getItem("i18n"));

                for (di = 0; di<dts.length; di++){
                        elem = dts[di];
                        key = elem.getAttribute("data-i18n");
                        if (key in datas){
                                elem.textContent = datas[key];
                        }

                }
                //met a dispo les traductions si en a besoin ailleurs
                _I18n_ = datas;
        } catch (Error){
                
        }
}
